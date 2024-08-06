const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const path = require('path');
const {CoverAgent} = require('./CoverAgent');
const codebolt = require('@codebolt/codeboltjs').default;

// Ensure this path is correct based on your project structure
const { version } = require('./cover_agent/version'); 
console.log(`Cover Agent version: ${version}`);// Ensure this path is correct based on your project structure

function parseArgs() {
    return yargs(hideBin(process.argv))
        .usage(`Cover Agent v1.0.0`)
        .option('source-file-path', {
            describe: 'the path of the source file to be tested.',
            demandOption: true,
            type: 'string'
        })
        .option('test-file-path', {
            describe: 'Path to the test file.',
            demandOption: true,
            type: 'string'
        })
        .option('test-file-output-path', {
            describe: 'Path to the output test file.',
            default: '',
            type: 'string'
        })
        .option('code-coverage-report-path', {
            describe: 'Path to the code coverage report file.',
            demandOption: true,
            type: 'string'
        })
        .option('test-command', {
            describe: 'The command to run tests and generate coverage report.',
            demandOption: true,
            type: 'string'
        })
        .option('test-command-dir', {
            describe: 'The directory to run the test command in.',
            default: process.cwd(),
            type: 'string'
        })
        .option('included-files', {
            describe: 'List of files to include in the coverage.',
            type: 'array'
        })
        .option('coverage-type', {
            describe: 'Type of coverage report.',
            default: 'cobertura',
            type: 'string'
        })
        .option('report-filepath', {
            describe: 'Path to the output report file.',
            default: 'test_results.html',
            type: 'string'
        })
        .option('desired-coverage', {
            describe: 'The desired coverage percentage.',
            default: 90,
            type: 'number'
        })
        .option('max-iterations', {
            describe: 'The maximum number of iterations.',
            default: 10,
            type: 'number'
        })
        .option('additional-instructions', {
            describe: 'Any additional instructions you wish to append at the end of the prompt.',
            default: '',
            type: 'string'
        })
        .option('model', {
            describe: 'Which LLM model to use.',
            default: 'gpt-4o',
            type: 'string'
        })
        .option('api-base', {
            describe: 'The API url to use for Ollama or Hugging Face.',
            default: 'http://localhost:11434',
            type: 'string'
        })
        .option('strict-coverage', {
            describe: 'If set, Cover-Agent will return a non-zero exit code if the desired code coverage is not achieved.',
            type: 'boolean'
        })
        .argv;
}

async function main() {
    // const args = parseArgs();
    const agent = new CoverAgent({
        sourceFilePath: 'd:\\cover agent\\cover-agent\\cover_agent\\cover_agent\\sourcefile.js',

        testFilePath: 'd:\\cover agent\\cover-agent\\cover_agent\\cover_agent\\test.js',
        testFileOutputPath: '',
        codeCoverageReportPath: 'd:\\cover agent\\cover-agent\\cover_agent\\cover_agent\\coverage',
        testCommand: 'npm run test',
        testCommandDir: 'd:\\cover agent\\cover-agent\\cover_agent\\cover_agent',
        includedFiles: [],
        coverageType: 'cobertura',
        reportFilepath: 'test_results.html',
        desiredCoverage: 90,
        maxIterations: 10,
        additionalInstructions: '',
        model: 'gpt-4o',
        apiBase: 'http://localhost:11434',
        strictCoverage: false
    });
    await agent.run();
}

if (require.main === module) {
    main().catch(err => {
        console.error(err);
        process.exit(1);
    });
}

