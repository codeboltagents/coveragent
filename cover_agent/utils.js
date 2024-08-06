const yaml = require('js-yaml');
const log = console.log;

function loadYaml(responseText, keysFixYaml = []) {
    // Remove leading and trailing ```yaml and backticks
    responseText = responseText.trim().replace(/^```yaml/, '').replace(/`*$/, '');
    try {
        return yaml.safeLoad(responseText);
    } catch (error) {
        log(`Failed to parse AI prediction: ${error}. Attempting to fix YAML formatting.`);
        return tryFixYaml(responseText, keysFixYaml);
    }
}

function tryFixYaml(responseText, keysFixYaml = []) {
    let responseTextLines = responseText.split('\n');

    // Try to fix formatting by adding |-
    let responseTextLinesCopy = [...responseTextLines];
    for (let i = 0; i < responseTextLinesCopy.length; i++) {
        for (let key of keysFixYaml) {
            if (responseTextLinesCopy[i].includes(key) && !responseTextLinesCopy[i].includes('|-')) {
                responseTextLinesCopy[i] = responseTextLinesCopy[i].replace(`${key}`, `${key} |-`);
            }
        }
    }

    try {
        let data = yaml.safeLoad(responseTextLinesCopy.join('\n'));
        log('Successfully parsed AI prediction after adding |-\n');
        return data;
    } catch {}

    // Try to extract snippet between ```yaml tags
    let snippetPattern = /```yaml([\s\S]*?)```/gm;
    let snippetMatch = snippetPattern.exec(responseText);
    if (snippetMatch) {
        let snippetText = snippetMatch[1];
        try {
            let data = yaml.safeLoad(snippetText);
            log('Successfully parsed AI prediction after extracting yaml snippet');
            return data;
        } catch {}
    }

    // Try to remove leading and trailing curly brackets
    responseText = responseText.trim().replace(/(^{)|(}$)/g, '');
    try {
        let data = yaml.safeLoad(responseText);
        log('Successfully parsed AI prediction after removing curly brackets');
        return data;
    } catch {}

    // Try to remove last lines iteratively
    for (let i = 1; i < responseTextLines.length; i++) {
        let responseTextLinesTmp = responseTextLines.slice(0, -i).join('\n');
        try {
            let data = yaml.safeLoad(responseTextLinesTmp);
            if (data.language) {
                log(`Successfully parsed AI prediction after removing ${i} lines`);
                return data;
            }
        } catch {}
    }

    // Fallback: attempt to use 'language:' key as a starting point
    try {
        let indexStart = responseText.indexOf('\nlanguage:');
        if (indexStart === -1) indexStart = responseText.indexOf('language:');
        let indexLastCode = responseText.lastIndexOf('test_code:');
        let indexEnd = responseText.indexOf('\n\n', indexLastCode);
        if (indexEnd === -1) indexEnd = responseText.length;
        let responseTextCopy = responseText.slice(indexStart, indexEnd).trim();
        try {
            let data = yaml.safeLoad(responseTextCopy);
            log('Successfully parsed AI prediction when using the language: key as a starting point');
            return data;
        } catch {}
    } catch {}

    return {};
}

// Example usage
let responseText = "```yaml\nkey1: value1\nkey2: value2\n```";
let parsedData = loadYaml(responseText, ['key1', 'key2']);
log(parsedData);
