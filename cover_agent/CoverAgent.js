const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const { execSync } = require('child_process');
const winston = require('winston');
const dotenv = require('dotenv');

const CustomLogger = require('./CustomLogger'); // Adapt based on your structure
const ReportGenerator = require('./ReportGenerator');
const UnitTestGenerator = require('./UnitTestGenerator');

dotenv.config();

class CoverAgent {
    constructor(args) {
        this.args = args;
        this.logger = CustomLogger.getLogger("D:\\cover agent\\cover-agent\\cover_agent\\index.js");

        this._validatePaths();
        this._duplicateTestFile();

        this.testGen = new UnitTestGenerator({
            sourceFilePath: args.sourceFilePath,
            testFilePath: args.testFileOutputPath,
            codeCoverageReportPath: args.codeCoverageReportPath,
            testCommand: args.testCommand,
            testCommandDir: args.testCommandDir,
            includedFiles: args.includedFiles,
            coverageType: args.coverageType,
            desiredCoverage: args.desiredCoverage,
            additionalInstructions: args.additionalInstructions,
            // llmModel: args.model,
            // apiBase: args.apiBase,
        });
    }

    _validatePaths() {
        if (!fs.existsSync(this.args.sourceFilePath)) {
            throw new Error(`Source file not found at ${this.args.sourceFilePath}`);
        }
        if (!fs.existsSync(this.args.testFilePath)) {
            throw new Error(`Test file not found at ${this.args.testFilePath}`);
        }
    }

    _duplicateTestFile() {
        if (this.args.testFileOutputPath !== "") {
            fs.copySync(this.args.testFilePath, this.args.testFileOutputPath);
        } else {
            this.args.testFileOutputPath = this.args.testFilePath;
        }
    }

    async run() {
        if (process.env.WANDB_API_KEY) {
            const wandb = require('node-wandb'); // Replace with actual WandB integration package
            const timeAndDate = moment().format("YYYY-MM-DD_HH-mm-ss");
            const runName = `${this.args.model}_${timeAndDate}`;
            wandb.login(process.env.WANDB_API_KEY);
            wandb.init({
                project: "cover-agent",
                name: runName
            });
        }

        let iterationCount = 0;
        let testResultsList = [];

        await this.testGen.initialTestSuiteAnalysis();

        while (
            this.testGen.currentCoverage < (this.testGen.desiredCoverage / 100) &&
            iterationCount < this.args.maxIterations
        ) {
            this.logger.info(`Current Coverage: ${(this.testGen.currentCoverage * 100).toFixed(2)}%`);
            this.logger.info(`Desired Coverage: ${this.testGen.desiredCoverage}%`);

            const generatedTestsDict = await this.testGen.generateTests({ maxTokens: 4096 });

            for (const generatedTest of generatedTestsDict.newTests || []) {
                const testResult = await this.testGen.validateTest(generatedTest, generatedTestsDict);
                testResultsList.push(testResult);
            }

            iterationCount++;

            if (this.testGen.currentCoverage < (this.testGen.desiredCoverage / 100)) {
                await this.testGen.runCoverage();
            }
        }

        if (this.testGen.currentCoverage >= (this.testGen.desiredCoverage / 100)) {
            this.logger.info(`Reached above target coverage of ${this.testGen.desiredCoverage}% (Current Coverage: ${(this.testGen.currentCoverage * 100).toFixed(2)}%) in ${iterationCount} iterations.`);
        } else if (iterationCount === this.args.maxIterations) {
            const failureMessage = `Reached maximum iteration limit without achieving desired coverage. Current Coverage: ${(this.testGen.currentCoverage * 100).toFixed(2)}%`;
            if (this.args.strictCoverage) {
                this.logger.error(failureMessage);
                process.exit(2);
            } else {
                this.logger.info(failureMessage);
            }
        }

        ReportGenerator.generateReport(testResultsList, this.args.reportFilepath);

        if (process.env.WANDB_API_KEY) {
            wandb.finish();
        }
    }
}

module.exports = {CoverAgent};
