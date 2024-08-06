const fs = require('fs');
const path = require('path');

function getVersion() {
    // Determine the base path depending on whether the script is bundled
    let base_path = "D:\\cover agent\\cover-agent\\cover_agent"; // By default, use the directory of the current script

    if (process.pkg) {
        // If the script is bundled using pkg
        base_path = path.dirname(process.execPath);
    }

    // Construct the path to version.txt
    const version_file_path = path.join(base_path, 'version.txt');

    // Read and return the version from version.txt
    try {
        const version = fs.readFileSync(version_file_path, 'utf-8').trim();
        return version;
    } catch (err) {
        console.error(`Error reading version.txt: ${err}`);
        return null; // Or handle the error as needed
    }
}

const version = getVersion();
console.log(`Application Version: ${version}`);
