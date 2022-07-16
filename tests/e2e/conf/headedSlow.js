require('dotenv').config();

module.exports = {
    testDir: '../',
    testMatch: '*.test.js',
    workers: 1,
    use: {
        headless: false,
        slowMo: 250
    }
};
