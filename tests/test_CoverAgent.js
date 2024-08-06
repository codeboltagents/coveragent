const fs = require('fs');
const path = require('path');
const { CoverAgent } = require('./cover_agent/CoverAgent');
const { parseArgs } = require('./cover_agent/main');

jest.mock('fs');
jest.mock('./cover_agent/CoverAgent');
jest.mock('./cover_agent/main');

describe('CoverAgent', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('parseArgs', () => {
        process.argv = [
            'node',
            'program.js',
            '--source-file-path',
            'test_source.js',
            '--test-file-path',
            'test_file.js',
            '--code-coverage-report-path',
            'coverage_report.xml',
            '--test-command',
            'jest',
            '--max-iterations',
            '10',
        ];

        const args = parseArgs();
        expect(args.sourceFilePath).toBe('test_source.js');
        expect(args.testFilePath).toBe('test_file.js');
        expect(args.codeCoverageReportPath).toBe('coverage_report.xml');
        expect(args.testCommand).toBe('jest');
        expect(args.testCommandDir).toBe(process.cwd());
        expect(args.includedFiles).toBeUndefined();
        expect(args.coverageType).toBe('cobertura');
        expect(args.reportFilepath).toBe('test_results.html');
        expect(args.desiredCoverage).toBe(90);
        expect(args.maxIterations).toBe(10);
    });

    test('agent source file not found', () => {
        const args = {
            sourceFilePath: 'test_source.js',
            testFilePath: 'test_file.js',
            codeCoverageReportPath: 'coverage_report.xml',
            testCommand: 'jest',
            testCommandDir: process.cwd(),
            includedFiles: undefined,
            coverageType: 'cobertura',
            reportFilepath: 'test_results.html',
            desiredCoverage: 90,
            maxIterations: 10,
        };
        parseArgs.mockReturnValue(args);
        fs.existsSync.mockReturnValue(false);

        expect(() => new CoverAgent(args)).toThrow(`Source file not found at ${args.sourceFilePath}`);
        expect(CoverAgent.UnitTestGenerator).not.toHaveBeenCalled();
        expect(CoverAgent.ReportGenerator.generateReport).not.toHaveBeenCalled();
    });

    test('agent test file not found', () => {
        const args = {
            sourceFilePath: 'test_source.js',
            testFilePath: 'test_file.js',
            codeCoverageReportPath: 'coverage_report.xml',
            testCommand: 'jest',
            testCommandDir: process.cwd(),
            includedFiles: undefined,
            coverageType: 'cobertura',
            reportFilepath: 'test_results.html',
            desiredCoverage: 90,
            maxIterations: 10,
            promptOnly: false,
        };
        parseArgs.mockReturnValue(args);
        fs.existsSync.mockImplementation((filePath) => {
            if (filePath === args.sourceFilePath) {
                return true;
            } else if (filePath === args.testFilePath) {
                return false;
            }
        });

        expect(() => new CoverAgent(args)).toThrow(`Test file not found at ${args.testFilePath}`);
    });
});
