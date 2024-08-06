const { exec } = require('child_process');

class Runner {
    static runCommand(command, cwd = null) {
        return new Promise((resolve, reject) => {
            // Get the current time before running the command, in milliseconds
            const commandStartTime = Date.now();

            const options = { cwd: cwd, shell: true };

            exec(command, options, (error, stdout, stderr) => {
                if (error) {
                    reject({ stdout, stderr, exitCode: error.code, commandStartTime });
                } else {
                    resolve({ stdout, stderr, exitCode: 0, commandStartTime });
                }
            });
        });
    }
}

// Example usage
Runner.runCommand('ls -la', '/path/to/directory')
    .then(result => {
        console.log('Output:', result.stdout);
        console.log('Error:', result.stderr);
        console.log('Exit Code:', result.exitCode);
        console.log('Command Start Time:', result.commandStartTime);
    })
    .catch(error => {
        console.log('Output:', error.stdout);
        console.log('Error:', error.stderr);
        console.log('Exit Code:', error.exitCode);
        console.log('Command Start Time:', error.commandStartTime);
    });
