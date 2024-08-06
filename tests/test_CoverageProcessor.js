const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const CoverageProcessor = require('./cover_agent/CoverageProcessor'); // Adjust the path as necessary

jest.mock('fs');

describe('CoverageProcessor Tests', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  const mockXMLString = `
    <coverage>
      <packages>
        <package>
          <classes>
            <class filename="app.py">
              <lines>
                <line number="1" hits="1"/>
                <line number="2" hits="0"/>
              </lines>
            </class>
          </classes>
        </package>
      </packages>
    </coverage>`;

  function mockXMLTree() {
    const parser = new xml2js.Parser();
    return parser.parseStringPromise(mockXMLString);
  }

  test('parse_coverage_report_cobertura', async () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue(mockXMLString);
    const processor = new CoverageProcessor("fake_path", "app.py", "cobertura");

    const [coveredLines, missedLines, coveragePct] = await processor.parseCoverageReport();

    expect(coveredLines).toEqual([1]);
    expect(missedLines).toEqual([2]);
    expect(coveragePct).toBe(0.5);
  });

  test('correct_parsing_for_matching_package_and_class', () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue('PACKAGE,CLASS,LINE_MISSED,LINE_COVERED\ncom.example,MyClass,5,10');
    const processor = new CoverageProcessor("path/to/coverage_report.csv", "path/to/MyClass.java", "jacoco");

    const [missed, covered] = processor.parseMissedCoveredLinesJacoco("com.example", "MyClass");

    expect(missed).toBe(5);
    expect(covered).toBe(10);
  });

  test('returns_empty_lists_and_float', () => {
    jest.spyOn(CoverageProcessor.prototype, 'extractPackageAndClassJava').mockReturnValue(['com.example', 'Example']);
    jest.spyOn(CoverageProcessor.prototype, 'parseMissedCoveredLinesJacoco').mockReturnValue([0, 0]);

    const processor = new CoverageProcessor("path/to/coverage.xml", "path/to/example.java", "jacoco");

    const [linesCovered, linesMissed, coveragePercentage] = processor.parseCoverageReportJacoco();

    expect(linesCovered).toEqual([]);
    expect(linesMissed).toEqual([]);
    expect(coveragePercentage).toBe(0);
  });

  test('parse_coverage_report_unsupported_type', () => {
    const processor = new CoverageProcessor("fake_path", "app.py", "unsupported_type");

    expect(() => processor.parseCoverageReport()).toThrow('Unsupported coverage report type: unsupported_type');
  });

  test('parse_coverage_report_not_implemented', () => {
    const processor = new CoverageProcessor("fake_path", "app.py", "lcov");

    expect(() => processor.parseCoverageReport()).toThrow('Parsing for lcov coverage reports is not implemented yet.');
  });

  test('extract_package_and_class_java_file_error', () => {
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => { throw new Error("File not found") });
    const processor = new CoverageProcessor("fake_path", "path/to/MyClass.java", "jacoco");

    expect(() => processor.extractPackageAndClassJava()).toThrow('File not found');
  });

  test('extract_package_and_class_java', () => {
    const javaFileContent = `
      package com.example;

      public class MyClass {
          // class content
      }
    `;
    jest.spyOn(fs, 'readFileSync').mockReturnValue(javaFileContent);
    const processor = new CoverageProcessor("fake_path", "path/to/MyClass.java", "jacoco");

    const [packageName, className] = processor.extractPackageAndClassJava();

    expect(packageName).toBe('com.example');
    expect(className).toBe('MyClass');
  });

  test('verify_report_update_file_not_updated', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'statSync').mockReturnValue({ mtime: new Date(1234567.0 * 1000) });

    const processor = new CoverageProcessor("fake_path", "app.py", "cobertura");

    expect(() => processor.verifyReportUpdate(1234567890)).toThrow('Fatal: The coverage report file was not updated after the test command.');
  });

  test('verify_report_update_file_not_exist', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    const processor = new CoverageProcessor("fake_path", "app.py", "cobertura");

    expect(() => processor.verifyReportUpdate(1234567890)).toThrow('Fatal: Coverage report "fake_path" was not generated.');
  });

  test('process_coverage_report', () => {
    jest.spyOn(CoverageProcessor.prototype, 'verifyReportUpdate').mockImplementation(() => {});
    jest.spyOn(CoverageProcessor.prototype, 'parseCoverageReport').mockReturnValue([[], [], 0.0]);

    const processor = new CoverageProcessor("fake_path", "app.py", "cobertura");
    const result = processor.processCoverageReport(1234567890);

    expect(CoverageProcessor.prototype.verifyReportUpdate).toHaveBeenCalledWith(1234567890);
    expect(CoverageProcessor.prototype.parseCoverageReport).toHaveBeenCalled();
    expect(result).toEqual([[], [], 0.0]);
  });

  test('parse_missed_covered_lines_jacoco_key_error', () => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue('PACKAGE,CLASS,LINE_MISSED,LINE_COVERED\ncom.example,MyClass,5,10');
    jest.spyOn(fs, 'createReadStream').mockReturnValue({
      pipe: jest.fn().mockReturnValue({
        on: (event, callback) => {
          if (event === 'data') callback({ PACKAGE: 'com.example', CLASS: 'MyClass', LINE_MISSED: '5' }); // Missing 'LINE_COVERED'
          if (event === 'end') callback();
        }
      })
    });

    const processor = new CoverageProcessor("path/to/coverage_report.csv", "path/to/MyClass.java", "jacoco");

    expect(() => processor.parseMissedCoveredLinesJacoco("com.example", "MyClass")).toThrow();
  });
});
