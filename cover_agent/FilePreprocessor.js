const fs = require('fs');
const path = require('path');
const esprima = require('esprima');

class FilePreprocessor {
    constructor(pathToFile) {
        this.pathToFile = pathToFile;

        // List of rules/action key pair.
        // Add your new rule and how to process the text (function) here
        this.rules = [{ condition: this._isJavaScriptFile.bind(this), action: this._processIfJavaScript.bind(this) }];
    }

    processFile(text) {
        /**
         * Process the text based on the internal rules.
         */
        for (const { condition, action } of this.rules) {
            if (condition()) {
                return action(text);
            }
        }
        return text;  // Return the text unchanged if no rules apply
    }

    _isJavaScriptFile() {
        /**
         * Rule to check if the file is a JavaScript file.
         */
        return this.pathToFile.endsWith('.js');
    }

    _processIfJavaScript(text) {
        /**
         * Action to process JavaScript files by checking for class definitions and indenting if found.
         */
        if (this._containsClassDefinition()) {
            return text.split('\n').map(line => '    ' + line).join('\n');
        }
        return text;
    }

    _containsClassDefinition() {
        /**
         * Check if the file contains a JavaScript class definition using the esprima module.
         */
        try {
            const content = fs.readFileSync(this.pathToFile, 'utf8');
            const parsedAst = esprima.parseScript(content);
            for (const node of parsedAst.body) {
                if (node.type === 'ClassDeclaration') {
                    return true;
                }
            }
        } catch (e) {
            console.error(`Error when parsing the file: ${e.message}`);
        }
        return false;
    }
}

module.exports = FilePreprocessor;
