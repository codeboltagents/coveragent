const fs = require('fs');
const path = require('path');
const { expect } = require('chai');
const sinon = require('sinon');
const { getVersion } = require('./path/to/version'); // Adjust the path as needed

const VERSION_FILE_LOCATION = path.join(__dirname, '..', 'cover_agent', 'version.txt');

describe('getVersion Tests', function() {
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(function() {
    sandbox.restore();
  });

  it('should return the version from the file', function() {
    sandbox.stub(fs, 'readFileSync').returns('1.2.3');

    const version = getVersion();
    expect(version).to.equal('1.2.3');
  });

  it('should throw an error if the file is missing', function() {
    sandbox.stub(fs, 'readFileSync').throws(new Error('File not found'));

    expect(() => getVersion()).to.throw(Error, 'File not found');
  });

  it('should return an empty string if the file is empty or contains only whitespace', function() {
    sandbox.stub(fs, 'readFileSync').returns('   ');

    const version = getVersion();
    expect(version).to.equal('');
  });
});
