const { test } = require('@playwright/test');
const DataHelper = require('./helpers/data.helper.js');
const GlobalHelper = require('./helpers/global.helper.js');
const ConfigHelper = require('./helpers/config.helper.js');

test.describe('[Configuration]', () => {
    test('Initializing tests', async ({ page }) => {
        await page.setDefaultTimeout(5000);
        await DataHelper.resetAuth();
        await DataHelper.resetData();
        await GlobalHelper.login(page);
        await GlobalHelper.changeLanguage(page, 'en');
        await GlobalHelper.assertFooter(page);
    });

    test('Should display correct pages', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/config/settings'));
        await ConfigHelper.assertPage(page, 'settings');
        await page.goto(GlobalHelper.url('/config/admins'));
        await ConfigHelper.assertPage(page, 'admins');
        await page.goto(GlobalHelper.url('/config/types'));
        await ConfigHelper.assertPage(page, 'types');
        await page.goto(GlobalHelper.url('/config/admins'));
        await ConfigHelper.assertPage(page, 'admins');
    });

    test('Should switch config tabs', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/config/settings'));
        await ConfigHelper.selectTab(page, 'settings');
        await ConfigHelper.assertPage(page, 'settings');
        await ConfigHelper.selectTab(page, 'admins');
        await ConfigHelper.assertPage(page, 'admins');
        await ConfigHelper.selectTab(page, 'types');
        await ConfigHelper.assertPage(page, 'types');
        await ConfigHelper.selectTab(page, 'settings');
        await ConfigHelper.assertPage(page, 'settings');
        await ConfigHelper.selectTab(page, 'admins');
        await ConfigHelper.assertPage(page, 'admins');
    });
});
