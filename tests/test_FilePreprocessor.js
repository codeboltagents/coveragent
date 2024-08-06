const chai = require('chai');
const fs = require('fs');
const path = require('path');
const { FilePreprocessor } = require('./cover_agent/FilePreprocessor');
const { expect } = chai;

describe('FilePreprocessor', function () {
    function createTempFileWithContent(suffix, content) {
        const tmpFilePath = path.join(__dirname, `temp${suffix}`);
        fs.writeFileSync(tmpFilePath, content);
        return tmpFilePath;
    }

    afterEach(function () {
        fs.readdirSync(__dirname)
            .filter(file => file.startsWith('temp'))
            .forEach(file => fs.unlinkSync(path.join(__dirname, file)));
    });

    // Test for a C file
    it('should not alter the text for C files', function () {
        const tmpFilePath = createTempFileWithContent('.c', '');
        const preprocessor = new FilePreprocessor(tmpFilePath);
        const inputText = "Lorem ipsum dolor sit amet,\nconsectetur adipiscing elit,\nsed do eiusmod tempor incididunt.";
        const processedText = preprocessor.processFile(inputText);
        expect(processedText).to.equal(inputText, "C file processing should not alter the text.");
    });

    // Test for a Python file with only a function
    it('should not alter the text for Python file without class', function () {
        const tmpFilePath = createTempFileWithContent('.py', 'def function():\n    pass\n');
        const preprocessor = new FilePreprocessor(tmpFilePath);
        const inputText = "Lorem ipsum dolor sit amet,\nconsectetur adipiscing elit,\nsed do eiusmod tempor incididunt.";
        const processedText = preprocessor.processFile(inputText);
        expect(processedText).to.equal(inputText, "Python file without class should not alter the text.");
    });

    // Test for a Python file with a comment that looks like a class definition
    it('should not trigger processing for commented class definition', function () {
        const tmpFilePath = createTempFileWithContent('.py', '# class myPythonFile:\n#    pass\n');
        const preprocessor = new FilePreprocessor(tmpFilePath);
        const inputText = "Lorem ipsum dolor sit amet,\nconsectetur adipiscing elit,\nsed do eiusmod tempor incididunt.";
        const processedText = preprocessor.processFile(inputText);
        expect(processedText).to.equal(inputText, "Commented class definition should not trigger processing.");
    });

    // Test for a Python file with an actual class definition
    it('should indent the text for Python file with class', function () {
        const tmpFilePath = createTempFileWithContent('.py', 'class MyClass:\n    def method(self):\n        pass\n');
        const preprocessor = new FilePreprocessor(tmpFilePath);
        const inputText = "Lorem ipsum dolor sit amet,\nconsectetur adipiscing elit,\nsed do eiusmod tempor incididunt.";
        const processedText = preprocessor.processFile(inputText);
        const expectedOutput = inputText.split('\n').map(line => '    ' + line).join('\n');
        expect(processedText).to.equal(expectedOutput, "Python file with class should indent the text.");
    });

    // Test for a Python file with syntax error
    it('should not alter the text for Python file with syntax error', function () {
        const tmpFilePath = createTempFileWithContent('.py', 'def function(:\n    pass\n'); // Invalid syntax
        const preprocessor = new FilePreprocessor(tmpFilePath);
        const inputText = "Lorem ipsum dolor sit amet,\nconsectetur adipiscing elit,\nsed do eiusmod tempor incididunt.";
        const processedText = preprocessor.processFile(inputText);
        expect(processedText).to.equal(inputText, "Python file with syntax error should not alter the text and handle the exception gracefully.");
    });
});
