const fs = require('fs-extra');
const path = require('path');
const jinja = require('jinja-js');
const winston = require('winston');
const getSettings = require('./cover_agent/settings/config_loader').getSettings;

const MAX_TESTS_PER_RUN = 4;

// Markdown text used as conditional appends
const ADDITIONAL_INCLUDES_TEXT = `
## Additional Includes
The following is a set of included files used as context for the source code above. This is usually included libraries needed as context to write better tests:
======
{{included_files}}
======
`;

const ADDITIONAL_INSTRUCTIONS_TEXT = `
## Additional Instructions
======
{{additional_instructions}}
======
`;

const FAILED_TESTS_TEXT = `
## Previous Iterations Failed Tests
Below is a list of failed tests that you generated in previous iterations. Do not generate the same tests again, and take the failed tests into account when generating new tests.
======
{{failed_test_runs}}
======
`;

class PromptBuilder {
    constructor({
        sourceFilePath,
        testFilePath,
        codeCoverageReport,
        includedFiles = "",
        additionalInstructions = "",
        failedTestRuns = "",
        language = "python",
    }) {
        this.sourceFileName = path.basename(sourceFilePath);
        this.testFileName = path.basename(testFilePath);
        this.sourceFile = this._readFile(sourceFilePath);
        this.testFile = this._readFile(testFilePath);
        this.codeCoverageReport = codeCoverageReport;
        this.language = language;

        this.sourceFileNumbered = this._numberLines(this.sourceFile);
        this.testFileNumbered = this._numberLines(this.testFile);

        // Conditionally fill in optional sections
        this.includedFiles = includedFiles
            ? jinja.renderString(ADDITIONAL_INCLUDES_TEXT, { included_files: includedFiles })
            : "";
        this.additionalInstructions = additionalInstructions
            ? jinja.renderString(ADDITIONAL_INSTRUCTIONS_TEXT, { additional_instructions: additionalInstructions })
            : "";
        this.failedTestRuns = failedTestRuns
            ? jinja.renderString(FAILED_TESTS_TEXT, { failed_test_runs: failedTestRuns })
            : "";
    }

    _readFile(filePath) {
        try {
            return fs.readFileSync(filePath, 'utf-8');
        } catch (e) {
            return `Error reading ${filePath}: ${e}`;
        }
    }

    _numberLines(fileContent) {
        return fileContent
            .split('\n')
            .map((line, i) => `${i + 1} ${line}`)
            .join('\n');
    }

    buildPrompt() {
        const variables = {
            source_file_name: this.sourceFileName,
            test_file_name: this.testFileName,
            source_file_numbered: this.sourceFileNumbered,
            test_file_numbered: this.testFileNumbered,
            source_file: this.sourceFile,
            test_file: this.testFile,
            code_coverage_report: this.codeCoverageReport,
            additional_includes_section: this.includedFiles,
            failed_tests_section: this.failedTestRuns,
            additional_instructions_text: this.additionalInstructions,
            language: this.language,
            max_tests: MAX_TESTS_PER_RUN,
        };

        const environment = new jinja.Environment({
            undefined: jinja.StrictUndefined,
        });

        try {
            const settings = getSettings();
            const systemPrompt = environment.renderString(
                settings.test_generation_prompt.system,
                variables
            );
            const userPrompt = environment.renderString(
                settings.test_generation_prompt.user,
                variables
            );
            return { system: systemPrompt, user: userPrompt };
        } catch (e) {
            winston.error(`Error rendering prompt: ${e}`);
            return { system: "", user: "" };
        }
    }

    buildPromptCustom(file) {
        const variables = {
            source_file_name: this.sourceFileName,
            test_file_name: this.testFileName,
            source_file_numbered: this.sourceFileNumbered,
            test_file_numbered: this.testFileNumbered,
            source_file: this.sourceFile,
            test_file: this.testFile,
            code_coverage_report: this.codeCoverageReport,
            additional_includes_section: this.includedFiles,
            failed_tests_section: this.failedTestRuns,
            additional_instructions_text: this.additionalInstructions,
            language: this.language,
            max_tests: MAX_TESTS_PER_RUN,
        };

        const environment = new jinja.Environment({
            undefined: jinja.StrictUndefined,
        });

        try {
            const settings = getSettings();
            const systemPrompt = environment.renderString(
                settings[file].system,
                variables
            );
            const userPrompt = environment.renderString(
                settings[file].user,
                variables
            );
            return { system: systemPrompt, user: userPrompt };
        } catch (e) {
            winston.error(`Error rendering prompt: ${e}`);
            return { system: "", user: "" };
        }
    }
}

module.exports = PromptBuilder;
