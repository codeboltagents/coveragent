const path = require('path');
const { parseArgs, main } = require('cover_agent/main');
const { CoverAgent } = require('cover_agent');
const fs = require('fs');
const { jest } = require('@jest/globals');

describe('Main', () => {
    it('should parse args correctly', () => {
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

    it('should throw error when source file is not found', async () => {
        jest.spyOn(fs, 'existsSync').mockImplementation((filePath) => {
            if (filePath === 'test_source.js') return false;
            return true;
        });

        const args = {
            sourceFilePath: 'test_source.js',
            testFilePath: 'test_file.js',
            codeCoverageReportPath: 'coverage_report.xml',
            testCommand: 'jest',
            testCommandDir: process.cwd(),
            includedFiles: null,
            coverageType: 'cobertura',
            reportFilepath: 'test_results.html',
            desiredCoverage: 90,
            maxIterations: 10,
        };

        jest.spyOn(parseArgs, 'parseArgs').mockImplementation(() => args);

        await expect(main()).rejects.toThrow(`Source file not found at ${args.sourceFilePath}`);
        expect(CoverAgent.UnitTestGenerator).not.toHaveBeenCalled();
        expect(CoverAgent.ReportGenerator.generateReport).not.toHaveBeenCalled();
    });

    it('should throw error when test file is not found', async () => {
        jest.spyOn(fs, 'existsSync').mockImplementation((filePath) => {
            if (filePath === 'test_file.js') return false;
            return true;
        });

        const args = {
            sourceFilePath: 'test_source.js',
            testFilePath: 'test_file.js',
            codeCoverageReportPath: 'coverage_report.xml',
            testCommand: 'jest',
            testCommandDir: process.cwd(),
            includedFiles: null,
            coverageType: 'cobertura',
            reportFilepath: 'test_results.html',
            desiredCoverage: 90,
            maxIterations: 10,
            promptOnly: false,
        };

        jest.spyOn(parseArgs, 'parseArgs').mockImplementation(() => args);

        await expect(main()).rejects.toThrow(`Test file not found at ${args.testFilePath}`);
        expect(CoverAgent.UnitTestGenerator).not.toHaveBeenCalled();
    });
});
