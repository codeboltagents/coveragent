const fs = require('fs-extra');
const path = require('path');
const csv = require('csv-parse');
const { parseStringPromise } = require('xml2js');
const winston = require('winston');
const CustomLogger = require('./cover_agent/CustomLogger'); // Adjust the path based on your structure

class CoverageProcessor {
    constructor(filePath, srcFilePath, coverageType) {
        /**
         * Initializes a CoverageProcessor object.
         *
         * @param {string} filePath - The path to the coverage report file.
         * @param {string} srcFilePath - The fully qualified path of the file for which coverage data is being processed.
         * @param {string} coverageType - The type of coverage report being processed.
         */
        this.filePath = filePath;
        this.srcFilePath = srcFilePath;
        this.coverageType = coverageType;
        this.logger = CustomLogger.getLogger(__filename);
    }

    async processCoverageReport(timeOfTestCommand) {
        /**
         * Verifies the coverage report's existence and update time, and then
         * parses the report based on its type to extract coverage data.
         *
         * @param {number} timeOfTestCommand - The time the test command was run, in milliseconds.
         * @returns {Promise<[Array<number>, Array<number>, number]>} A tuple containing lists of covered and missed line numbers, and the coverage percentage.
         */
        await this.verifyReportUpdate(timeOfTestCommand);
        return this.parseCoverageReport();
    }

    async verifyReportUpdate(timeOfTestCommand) {
        /**
         * Verifies the coverage report's existence and update time.
         *
         * @param {number} timeOfTestCommand - The time the test command was run, in milliseconds.
         * @throws Will throw an error if the coverage report does not exist or was not updated after the test command.
         */
        if (!await fs.pathExists(this.filePath)) {
            throw new Error(`Fatal: Coverage report "${this.filePath}" was not generated.`);
        }

        const fileStats = await fs.stat(this.filePath);
        const fileModTimeMs = fileStats.mtimeMs;

        if (fileModTimeMs <= timeOfTestCommand) {
            throw new Error(`Fatal: The coverage report file was not updated after the test command. fileModTimeMs: ${fileModTimeMs}, timeOfTestCommand: ${timeOfTestCommand}.`);
        }
    }

    async parseCoverageReport() {
        /**
         * Parses a code coverage report to extract covered and missed line numbers for a specific file,
         * and calculates the coverage percentage, based on the specified coverage report type.
         *
         * @returns {Promise<[Array<number>, Array<number>, number]>} A tuple containing lists of covered and missed line numbers, and the coverage percentage.
         */
        if (this.coverageType === 'cobertura') {
            return this.parseCoverageReportCobertura();
        } else if (this.coverageType === 'lcov') {
            throw new Error(`Parsing for ${this.coverageType} coverage reports is not implemented yet.`);
        } else if (this.coverageType === 'jacoco') {
            return this.parseCoverageReportJacoco();
        } else {
            throw new Error(`Unsupported coverage report type: ${this.coverageType}`);
        }
    }

    async parseCoverageReportCobertura() {
        /**
         * Parses a Cobertura XML code coverage report to extract covered and missed line numbers for a specific file,
         * and calculates the coverage percentage.
         *
         * @returns {Promise<[Array<number>, Array<number>, number]>} A tuple containing lists of covered and missed line numbers, and the coverage percentage.
         */
        const fileContent = await fs.readFile(this.filePath, 'utf-8');
        const result = await parseStringPromise(fileContent);
        const linesCovered = [];
        const linesMissed = [];
        const filename = path.basename(this.srcFilePath);

        result.coverage.packages[0].package.forEach(pkg => {
            pkg.classes[0].class.forEach(cls => {
                if (cls.$.filename && cls.$.filename.endsWith(filename)) {
                    cls.lines[0].line.forEach(line => {
                        const lineNumber = parseInt(line.$.number, 10);
                        const hits = parseInt(line.$.hits, 10);
                        if (hits > 0) {
                            linesCovered.push(lineNumber);
                        } else {
                            linesMissed.push(lineNumber);
                        }
                    });
                }
            });
        });

        const totalLines = linesCovered.length + linesMissed.length;
        const coveragePercentage = totalLines > 0 ? (linesCovered.length / totalLines) : 0;

        return [linesCovered, linesMissed, coveragePercentage];
    }

    async parseCoverageReportJacoco() {
        /**
         * Parses a JaCoCo XML code coverage report to extract covered and missed line numbers for a specific file,
         * and calculates the coverage percentage.
         *
         * @returns {Promise<[Array<number>, Array<number>, number]>} A tuple containing empty lists of covered and missed line numbers, and the coverage percentage.
         */
        const [packageName, className] = await this.extractPackageAndClassJava();
        const [missed, covered] = await this.parseMissedCoveredLinesJacoco(packageName, className);

        const totalLines = missed + covered;
        const coveragePercentage = totalLines > 0 ? (covered / totalLines) : 0;

        return [[], [], coveragePercentage];
    }

    async parseMissedCoveredLinesJacoco(packageName, className) {
        /**
         * Parses the JaCoCo CSV report to extract missed and covered lines.
         *
         * @param {string} packageName - The package name of the Java class.
         * @param {string} className - The class name of the Java class.
         * @returns {Promise<[number, number]>} A tuple containing missed and covered lines.
         */
        const fileContent = await fs.readFile(this.filePath, 'utf-8');
        const records = await new Promise((resolve, reject) => {
            csv(fileContent, { columns: true }, (err, output) => {
                if (err) reject(err);
                else resolve(output);
            });
        });

        let missed = 0;
        let covered = 0;

        records.forEach(row => {
            if (row['PACKAGE'] === packageName && row['CLASS'] === className) {
                missed = parseInt(row['LINE_MISSED'], 10);
                covered = parseInt(row['LINE_COVERED'], 10);
            }
        });

        return [missed, covered];
    }

    async extractPackageAndClassJava() {
        /**
         * Extracts the package and class name from the Java source file.
         *
         * @returns {Promise<[string, string]>} A tuple containing the package name and class name.
         */
        const packagePattern = /^\s*package\s+([\w\.]+)\s*;.*$/;
        const classPattern = /^\s*public\s+class\s+(\w+).*$/;

        let packageName = "";
        let className = "";

        const fileContent = await fs.readFile(this.srcFilePath, 'utf-8');
        const lines = fileContent.split('\n');

        lines.forEach(line => {
            if (!packageName) {
                const packageMatch = packagePattern.exec(line);
                if (packageMatch) {
                    packageName = packageMatch[1];
                }
            }

            if (!className) {
                const classMatch = classPattern.exec(line);
                if (classMatch) {
                    className = classMatch[1];
                }
            }

            if (packageName && className) {
                return false; // Break out of the loop
            }
        });

        if (!packageName || !className) {
            throw new Error(`Could not extract package or class name from ${this.srcFilePath}`);
        }

        return [packageName, className];
    }
}

module.exports = CoverageProcessor;
