const fs = require('fs');
const path = require('path');
const { expect } = require('chai');

const UnitTestGenerator = require('./path/to/UnitTestGenerator'); // Replace with actual path
const ReportGenerator = require('./path/to/ReportGenerator'); // Replace with actual path

describe('UnitTestGenerator Tests', function() {
  const GPT4_TURBO = "gpt-4-turbo-2024-04-09";
  const GPT35_TURBO = "gpt-3.5-turbo-0125";
  const MAX_TOKENS = 4096;
  const DRY_RUN = true;
  const REPO_ROOT = path.resolve(__dirname, '..');
  const TEST_FILE = path.join(REPO_ROOT, 'templated_tests', 'python_fastapi', 'test_app.py');

  let originalFileContents;

  before(function() {
    originalFileContents = fs.readFileSync(TEST_FILE, 'utf8');
  });

  afterEach(function() {
    fs.writeFileSync(TEST_FILE, originalFileContents, 'utf8');
  });

  it('should generate and validate tests - End to End 1', function() {
    const CANNED_TESTS = {
      "new_tests": [
        {
          "test_code": 'def test_current_date():\n    response = client.get("/current-date")\n    assert response.status_code == 200\n    assert "date" in response.json()'
        },
        {
          "test_code": 'def test_add():\n    response = client.get("/add/2/3")\n    assert response.status_code == 200\n    assert "result" in response.json()\n    assert response.json()["result"] == 5'
        },
      ]
    };

    const testGen = new UnitTestGenerator({
      sourceFilePath: path.join(REPO_ROOT, 'templated_tests', 'python_fastapi', 'app.py'),
      testFilePath: TEST_FILE,
      codeCoverageReportPath: path.join(REPO_ROOT, 'templated_tests', 'python_fastapi', 'coverage.xml'),
      llmModel: GPT35_TURBO,
      testCommand: "pytest --cov=. --cov-report=xml",
      testCommandDir: path.join(REPO_ROOT, 'templated_tests', 'python_fastapi'),
      includedFiles: null,
    });

    testGen.relevantLineNumberToInsertTestsAfter = 10;
    testGen.testHeadersIndentation = 4;

    const generatedTests = DRY_RUN ? CANNED_TESTS : testGen.generateTests(MAX_TOKENS, DRY_RUN);

    const resultsList = generatedTests.new_tests.map(generatedTest =>
      testGen.validateTest(generatedTest, generatedTests)
    );

    ReportGenerator.generateReport(resultsList, 'test_results.html');
  });

  it('should generate and validate tests - End to End 2', function() {
    const CANNED_TESTS = {
      "language": "python",
      "new_tests": [
        {
          "test_code": 'def test_current_date():\n    response = client.get("/current-date")\n    assert response.status_code == 200\n    assert "date" in response.json()',
          "new_imports_code": "",
        },
        {
          "test_code": 'def test_add():\n    response = client.get("/add/2/3")\n    assert response.status_code == 200\n    assert "result" in response.json()\n    assert response.json()["result"] == 5'
        },
      ],
    };

    const testGen = new UnitTestGenerator({
      sourceFilePath: path.join(REPO_ROOT, 'templated_tests', 'python_fastapi', 'app.py'),
      testFilePath: TEST_FILE,
      codeCoverageReportPath: path.join(REPO_ROOT, 'templated_tests', 'python_fastapi', 'coverage.xml'),
      llmModel: GPT35_TURBO,
      testCommand: "pytest --cov=. --cov-report=xml",
      testCommandDir: path.join(REPO_ROOT, 'templated_tests', 'python_fastapi'),
      includedFiles: null,
    });

    testGen.relevantLineNumberToInsertTestsAfter = 10;
    testGen.testHeadersIndentation = 4;

    const generatedTests = DRY_RUN ? CANNED_TESTS : testGen.generateTests(MAX_TOKENS, DRY_RUN);

    const resultsList = generatedTests.new_tests.map(generatedTest =>
      testGen.validateTest(generatedTest, generatedTests)
    );

    ReportGenerator.generateReport(resultsList, 'test_results.html');
  });

  it('should handle mixed file paths correctly', function() {
    const includedFiles = ['invalid_file1.txt', 'valid_file2.txt'];
    const result = UnitTestGenerator.getIncludedFiles(includedFiles);
    expect(result).to.equal('file_path: `valid_file2.txt`\ncontent:\n```\nfile content\n```');
  });

  it('should handle valid file paths correctly', function() {
    const includedFiles = ['file1.txt', 'file2.txt'];
    const result = UnitTestGenerator.getIncludedFiles(includedFiles);
    expect(result).to.equal('file_path: `file1.txt`\ncontent:\n```\nfile content\n```\nfile_path: `file2.txt`\ncontent:\n```\nfile content\n```');
  });
});

describe('Extract Error Message Tests', function() {
  const extractErrorMessagePython = require('./path/to/extractErrorMessagePython'); // Replace with actual path

  it('should extract single match', function() {
    const failMessage = "=== FAILURES ===\nError occurred here\n=== END ===";
    const expected = "\nError occurred here\n";
    const result = extractErrorMessagePython(failMessage);
    expect(result).to.equal(expected);
  });

  it('should handle bad match', function() {
    const failMessage = 33;
    const expected = "";
    const result = extractErrorMessagePython(failMessage);
    expect(result).to.equal(expected);
  });
});
