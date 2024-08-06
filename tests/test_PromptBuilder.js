const { PromptBuilder } = require('cover_agent/PromptBuilder');
const { readFileSync } = require('fs');
const { jest } = require('@jest/globals');

jest.mock('fs');

describe('PromptBuilder', () => {
    let mockReadFileSync;

    beforeEach(() => {
        mockReadFileSync = jest.fn((path) => "dummy content");
        readFileSync.mockImplementation(mockReadFileSync);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test('initialization reads file contents', () => {
        const builder = new PromptBuilder(
            "source_path",
            "test_path",
            "dummy content"
        );
        expect(builder.source_file).toBe("dummy content");
        expect(builder.test_file).toBe("dummy content");
        expect(builder.code_coverage_report).toBe("dummy content");
        expect(builder.included_files).toBe("");  // Updated expected value
    });

    test('initialization handles file read errors', () => {
        mockReadFileSync.mockImplementation(() => {
            throw new Error("File not found");
        });

        const builder = new PromptBuilder(
            "source_path",
            "test_path",
            "coverage_report"
        );
        expect(builder.source_file).toContain("Error reading source_path");
        expect(builder.test_file).toContain("Error reading test_path");
    });

    test('empty included files section not in prompt', () => {
        const builder = new PromptBuilder(
            "source_path",
            "test_path",
            "coverage_report",
            "Included Files Content"
        );

        builder.source_file = "Source Content";
        builder.test_file = "Test Content";
        builder.code_coverage_report = "Coverage Report Content";
        builder.included_files = "";

        const result = builder.build_prompt();
        expect(result.user).not.toContain("## Additional Includes");
    });

    test('non-empty included files section in prompt', () => {
        const builder = new PromptBuilder(
            "source_path",
            "test_path",
            "coverage_report",
            "Included Files Content"
        );

        builder.source_file = "Source Content";
        builder.test_file = "Test Content";
        builder.code_coverage_report = "Coverage Report Content";

        const result = builder.build_prompt();
        expect(result.user).toContain("## Additional Includes");
        expect(result.user).toContain("Included Files Content");
    });

    test('empty additional instructions section not in prompt', () => {
        const builder = new PromptBuilder(
            "source_path",
            "test_path",
            "coverage_report",
            ""
        );

        builder.source_file = "Source Content";
        builder.test_file = "Test Content";
        builder.code_coverage_report = "Coverage Report Content";

        const result = builder.build_prompt();
        expect(result.user).not.toContain("## Additional Instructions");
    });

    test('empty failed test runs section not in prompt', () => {
        const builder = new PromptBuilder(
            "source_path",
            "test_path",
            "coverage_report",
            ""
        );

        builder.source_file = "Source Content";
        builder.test_file = "Test Content";
        builder.code_coverage_report = "Coverage Report Content";

        const result = builder.build_prompt();
        expect(result.user).not.toContain("## Previous Iterations Failed Tests");
    });

    test('non-empty additional instructions section in prompt', () => {
        const builder = new PromptBuilder(
            "source_path",
            "test_path",
            "coverage_report",
            "Additional Instructions Content"
        );

        builder.source_file = "Source Content";
        builder.test_file = "Test Content";
        builder.code_coverage_report = "Coverage Report Content";

        const result = builder.build_prompt();
        expect(result.user).toContain("## Additional Instructions");
        expect(result.user).toContain("Additional Instructions Content");
    });

    // we currently disabled the logic to add failed test runs to the prompt
    test('non-empty failed test runs section in prompt', () => {
        const builder = new PromptBuilder(
            "source_path",
            "test_path",
            "coverage_report",
            "Failed Test Runs Content"
        );

        builder.source_file = "Source Content";
        builder.test_file = "Test Content";
        builder.code_coverage_report = "Coverage Report Content";

        const result = builder.build_prompt();
        expect(result.user).toContain("## Previous Iterations Failed Tests");
        expect(result.user).toContain("Failed Test Runs Content");
    });

    test('build prompt custom handles rendering exception', () => {
        const mockRender = jest.fn(() => { throw new Error("Rendering error"); });

        jest.mock('jinja2', () => ({
            Environment: {
                from_string: () => ({
                    render: mockRender
                })
            }
        }));

        const builder = new PromptBuilder(
            "source_path",
            "test_path",
            "coverage_report"
        );

        const result = builder.build_prompt_custom("custom_file");
        expect(result).toEqual({ system: "", user: "" });
    });

    test('build prompt handles rendering exception', () => {
        const mockRender = jest.fn(() => { throw new Error("Rendering error"); });

        jest.mock('jinja2', () => ({
            Environment: {
                from_string: () => ({
                    render: mockRender
                })
            }
        }));

        const builder = new PromptBuilder(
            "source_path",
            "test_path",
            "coverage_report"
        );

        const result = builder.build_prompt();
        expect(result).toEqual({ system: "", user: "" });
    });
});
