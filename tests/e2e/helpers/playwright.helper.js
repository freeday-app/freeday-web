const { chromium } = require('playwright');

const PlaywrightHelper = {

    browser: null,
    context: null,
    page: null,

    async start(headless = true) {
        PlaywrightHelper.browser = await chromium.launch({ headless });
        PlaywrightHelper.context = await PlaywrightHelper.browser.newContext();
        PlaywrightHelper.page = await PlaywrightHelper.context.newPage();
        return PlaywrightHelper.page;
    },

    async stop() {
        await PlaywrightHelper.page.close();
        await PlaywrightHelper.context.close();
        await PlaywrightHelper.browser.close();
    }

};

module.exports = PlaywrightHelper;
