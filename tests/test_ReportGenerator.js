const { ReportGenerator } = require('cover_agent/ReportGenerator'); // Adjust the import according to your project structure
const fs = require('fs');
const path = require('path');
const { jest } = require('@jest/globals');

describe('ReportGenerator', () => {
    let sampleResults, expectedOutput;

    beforeEach(() => {
        sampleResults = [
            {
                status: "pass",
                reason: "",
                exit_code: 0,
                stderr: "",
                stdout: "test session starts platform linux -- Python 3.10.12, pytest-7.0.1",
                test: "def test_current_date():\n    response = client.get('/current-date')\n    assert response.status_code == 200\n    assert 'date' in response.json()"
            },
            // Add more sample results as needed
        ];

        expectedOutput = {
            expectedStart: "<html>",
            expectedTableHeader: "<th>Status</th>",
            expectedRowContent: "test_current_date",
            expectedEnd: "</html>"
        };
    });

    test('generate_report', () => {
        const reportPath = path.join(__dirname, 'test_report.html');

        // Ensure the file is cleaned up before and after the test
        if (fs.existsSync(reportPath)) {
            fs.unlinkSync(reportPath);
        }

        ReportGenerator.generate_report(sampleResults, reportPath);

        const content = fs.readFileSync(reportPath, 'utf-8');

        // Verify that the expected pieces are present in the output
        expect(content).toContain(expectedOutput.expectedTableHeader);
        expect(content).toContain(expectedOutput.expectedRowContent);
        expect(content).toContain(expectedOutput.expectedEnd);

        // Clean up the test report file
        fs.unlinkSync(reportPath);
    });

    // You might want to add more detailed checks to ensure the content is exactly as expected
});
