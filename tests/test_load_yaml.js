const yaml = require('js-yaml');
const { expect } = require('chai');

const { loadYaml, tryFixYaml } = require('./cover_agent/utils');

describe('TestLoadYaml', function() {
    it('tests that loadYaml loads a valid YAML string', function() {
        const yamlStr = 'name: John Smith\nage: 35';
        const expectedOutput = { name: 'John Smith', age: 35 };
        expect(loadYaml(yamlStr)).to.deep.equal(expectedOutput);
    });

    it('test_load_invalid_yaml1', function() {
        const yamlStr = `
PR Analysis:
  Main theme: Enhancing the \`/describe\` command prompt by adding title and description
  Type of PR: Enhancement
  Relevant tests: No
  Focused PR: Yes, the PR is focused on enhancing the \`/describe\` command prompt.

PR Feedback:
  General suggestions: The PR seems to be well-structured and focused on a specific enhancement. However, it would be beneficial to add tests to ensure the new feature works as expected.
  Code feedback:
    - relevant file: pr_agent/settings/pr_description_prompts.toml
      suggestion: Consider using a more descriptive variable name than 'user' for the command prompt. A more descriptive name would make the code more readable and maintainable. [medium]
      relevant line: user="""PR Info: aaa
  Security concerns: No`;

        expect(() => yaml.safeLoad(yamlStr)).to.throw(yaml.YAMLException);

        const expectedOutput = {
            "PR Analysis": {
                "Main theme": "Enhancing the `/describe` command prompt by adding title and description",
                "Type of PR": "Enhancement",
                "Relevant tests": false,
                "Focused PR": "Yes, the PR is focused on enhancing the `/describe` command prompt."
            },
            "PR Feedback": {
                "General suggestions": "The PR seems to be well-structured and focused on a specific enhancement. However, it would be beneficial to add tests to ensure the new feature works as expected.",
                "Code feedback": [
                    {
                        "relevant file": "pr_agent/settings/pr_description_prompts.toml",
                        "suggestion": "Consider using a more descriptive variable name than 'user' for the command prompt. A more descriptive name would make the code more readable and maintainable. [medium]",
                        "relevant line": 'user="""PR Info: aaa'
                    }
                ],
                "Security concerns": false
            }
        };

        expect(loadYaml(yamlStr, ['relevant line:', 'suggestion content:', 'relevant file:', 'existing code:', 'improved code:'])).to.deep.equal(expectedOutput);
    });

    it('test_load_invalid_yaml2', function() {
        const yamlStr = `\
- relevant file: src/app.py:
  suggestion content: The print statement is outside inside the if __name__ ==:`;

        expect(() => yaml.safeLoad(yamlStr)).to.throw(yaml.YAMLException);

        const expectedOutput = [
            {
                "relevant file": "src/app.py:",
                "suggestion content": "The print statement is outside inside the if __name__ ==:"
            }
        ];

        expect(loadYaml(yamlStr, ['relevant line:', 'suggestion content:', 'relevant file:', 'existing code:', 'improved code:'])).to.deep.equal(expectedOutput);
    });
});

describe('TestTryFixYaml', function() {
    it('test_try_fix_yaml_snippet_extraction', function() {
        const yamlStr = '```yaml\nname: John Smith\nage: 35\n```';
        const expectedOutput = { name: 'John Smith', age: 35 };
        expect(tryFixYaml(yamlStr)).to.deep.equal(expectedOutput);
    });

    it('test_try_fix_yaml_remove_all_lines', function() {
        const yamlStr = 'language: python\nname: John Smith\nage: 35\ninvalid_line';
        const expectedOutput = { language: 'python', name: 'John Smith', age: 35 };
        expect(tryFixYaml(yamlStr)).to.deep.equal(expectedOutput);
    });

    it('test_try_fix_yaml_llama3_8b', function() {
        const yamlStr = `\
here is the response:

language: python
new_tests:
- test_behavior: |
    aaa
  test_name: test_current_date
  test_code: |
    bbb
  test_tags: happy path

hope this helps!`;
        const expectedOutput = {
            "here is the response": null,
            "language": "python",
            "new_tests": [
                {
                    "test_behavior": "aaa\n",
                    "test_name": "test_current_date",
                    "test_code": "bbb\n",
                    "test_tags": "happy path"
                }
            ]
        };
        expect(tryFixYaml(yamlStr)).to.deep.equal(expectedOutput);
    });

    it('test_invalid_yaml_wont_parse', function() {
        const yamlStr = `
here is the response

language: python
tests:
- test_behavior: |
  aaa
  test_name:`;
        const expectedOutput = null;
        expect(loadYaml(yamlStr)).to.equal(expectedOutput);
    });
});
