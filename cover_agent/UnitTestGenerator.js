const fs = require('fs-extra');
const { exec } = require('child_process');
const path = require('path');
const winston = require('winston');
const yaml = require('js-yaml');

class UnitTestGenerator {
    constructor({
        sourceFilePath,
        testFilePath,
        codeCoverageReportPath,
        testCommand,
        llmModel,
        apiBase = '',
        testCommandDir = process.cwd(),
        includedFiles = null,
        coverageType = 'cobertura',
        desiredCoverage = 90,
        additionalInstructions = '',
    }) {
        this.sourceFilePath = sourceFilePath;
        this.testFilePath = testFilePath;
        this.codeCoverageReportPath = codeCoverageReportPath;
        this.testCommand = testCommand;
        this.testCommandDir = testCommandDir;
        this.includedFiles = this.getIncludedFiles(includedFiles);
        this.coverageType = coverageType;
        this.desiredCoverage = desiredCoverage;
        this.additionalInstructions = additionalInstructions;
        this.language = this.getCodeLanguage(sourceFilePath);

        // Initialize logger
        // this.logger = winston.createLogger({
        //     level: 'info',
        //     format: winston.format.json(),
        //     defaultMeta: { service: 'unit-test-generator' },
        //     transports: [
        //         new winston.transports.Console(),
        //         new winston.transports.File({ filename: 'unit-test-generator.log' }),
        //     ],
        // });

        this.failedTestRuns = [];
        this.runCoverage();
        this.prompt = this.buildPrompt();
    }

    getCodeLanguage(sourceFilePath) {
        // This is a placeholder. You will need to implement the logic to get settings and language mappings
        const languageExtensionMapOrg = {
            python: ['.py'],
            javascript: ['.js'],
            // Add other languages and extensions here
        };

        const extension = path.extname(sourceFilePath);
        for (const [language, extensions] of Object.entries(languageExtensionMapOrg)) {
            if (extensions.includes(extension)) {
                return language.toLowerCase();
            }
        }
        return 'unknown';
    }

    async runCoverage() {
        // this.logger.info(`Running build/test command to generate coverage report: "${this.testCommand}"`);
        try {
            const { stdout, stderr } = await this.runCommand(this.testCommand, this.testCommandDir);
            this.logger.info(`Test command output:\n${stdout}\n${stderr}`);

            // Process coverage report
            const coverageProcessor = new CoverageProcessor({
                filePath: this.codeCoverageReportPath,
                srcFilePath: this.sourceFilePath,
                coverageType: this.coverageType,
            });

            const { linesCovered, linesMissed, percentageCovered } = await coverageProcessor.processCoverageReport();
            this.currentCoverage = percentageCovered;
            this.codeCoverageReport = `Lines covered: ${linesCovered}\nLines missed: ${linesMissed}\nPercentage covered: ${(percentageCovered * 100).toFixed(2)}%`;
        } catch (error) {
            // this.logger.error(`Error running test command: ${error}`);
            // throw new Error(`Fatal: Error running test command. Are you sure the command is correct? "${this.testCommand}"\nError: ${error}`);
        }
    }

    runCommand(command, cwd) {
        return new Promise((resolve, reject) => {
            exec(command, { cwd }, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({ stdout, stderr });
                }
            });
        });
    }

    async getIncludedFiles(includedFiles) {
        if (includedFiles) {
            let includedFilesContent = [];
            let fileNames = [];
            for (let filePath of includedFiles) {
                try {
                    const content = await fs.readFile(filePath, 'utf-8');
                    includedFilesContent.push(content);
                    fileNames.push(filePath);
                } catch (error) {
                    console.error(`Error reading file ${filePath}: ${error}`);
                }
            }
            let outStr = '';
            if (includedFilesContent.length) {
                for (let i = 0; i < includedFilesContent.length; i++) {
                    outStr += `file_path: \`${fileNames[i]}\`\ncontent:\n\`\`\`\n${includedFilesContent[i]}\n\`\`\`\n`;
                }
            }
            return outStr.trim();
        }
        return '';
    }

    buildPrompt() {
        let failedTestRunsValue = '';
        if (this.failedTestRuns.length) {
            try {
                for (let failedTest of this.failedTestRuns) {
                    let failedTestDict = failedTest.code || {};
                    if (!failedTestDict) continue;
                    let code = JSON.stringify(failedTestDict, null, 2);
                    let errorMessage = failedTest.error_message || null;
                    failedTestRunsValue += `Failed Test:\n\`\`\`\n${code}\n\`\`\`\n`;
                    if (errorMessage) {
                        failedTestRunsValue += `Error message for test above:\n${errorMessage}\n\n\n`;
                    } else {
                        failedTestRunsValue += `\n\n`;
                    }
                }
            } catch (error) {
                this.logger.error(`Error processing failed test runs: ${error}`);
                failedTestRunsValue = '';
            }
        }
        this.failedTestRuns = [];  // Reset the failed test runs

        // Build the prompt using PromptBuilder (implement PromptBuilder class)
        // this.promptBuilder = new PromptBuilder({
        //     sourceFilePath: this.sourceFilePath,
        //     testFilePath: this.testFilePath,
        //     codeCoverageReport: this.codeCoverageReport,
        //     includedFiles: this.includedFiles,
        //     additionalInstructions: this.additionalInstructions,
        //     failedTestRuns: failedTestRunsValue,
        //     language: this.language,
        // });

        // return this.promptBuilder.buildPrompt();

        // Placeholder for actual prompt building logic
        return `source file path: ${this.sourceFilePath}`;
    }

    async initialTestSuiteAnalysis() {
        // Implement the logic for initial test suite analysis
        // This will require calls to the AI model and processing its responses
    }

    async generateTests(maxTokens = 4096, dryRun = false) {
        this.prompt = this.buildPrompt();

        let response;
        if (dryRun) {
            response = `\`\`\`def test_something():\n    pass\`\`\`\n\`\`\`def test_something_else():\n    pass\`\`\`\n\`\`\`def test_something_different():\n    pass\`\`\``;
        } else {
            // Call AI model to generate tests (implement AICaller class)
            // const { response, promptTokenCount, responseTokenCount } = await this.aiCaller.callModel(this.prompt, maxTokens);
        }

        this.logger.info(`Generated tests response: ${response}`);

        try {
            const testsDict = yaml.load(response);
            if (!testsDict) return {};
            return testsDict;
        } catch (error) {
            this.logger.error(`Error during test generation: ${error}`);
            return {};
        }
    }

    async validateTest(generatedTest, generatedTestsDict) {
        // Implement the logic for validating the generated test
    }
}

module.exports = UnitTestGenerator;
