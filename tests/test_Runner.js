const { Runner } = require('cover_agent/Runner'); // Adjust the import path as necessary
const { execSync } = require('child_process');
const { jest } = require('@jest/globals');

class Runner {
    static run_command(command, options = {}) {
        try {
            const stdout = execSync(command, {
                cwd: options.cwd || process.cwd(),
                encoding: 'utf8'
            });
            return {
                stdout,
                stderr: '',
                exit_code: 0,
                error: null
            };
        } catch (error) {
            return {
                stdout: error.stdout ? error.stdout.toString() : '',
                stderr: error.stderr ? error.stderr.toString() : error.message,
                exit_code: error.status,
                error: error
            };
        }
    }
}

describe('Runner', () => {
    test('run_command_success', () => {
        const command = 'echo "Hello, World!"';
        const { stdout, stderr, exit_code } = Runner.run_command(command);
        expect(stdout.trim()).toBe("Hello, World!");
        expect(stderr).toBe("");
        expect(exit_code).toBe(0);
    });

    test('run_command_with_cwd', () => {
        const command = 'echo "Working Directory"';
        const cwd = '/tmp';
        const { stdout, stderr, exit_code } = Runner.run_command(command, { cwd });
        expect(stdout.trim()).toBe("Working Directory");
        expect(stderr).toBe("");
        expect(exit_code).toBe(0);
    });

    test('run_command_failure', () => {
        const command = "command_that_does_not_exist";
        const { stdout, stderr, exit_code } = Runner.run_command(command);
        expect(stdout).toBe("");
        expect(stderr).toMatch(/command_that_does_not_exist: not found|command_that_does_not_exist: command not found/);
        expect(exit_code).not.toBe(0);
    });
});

module.exports = { Runner };
