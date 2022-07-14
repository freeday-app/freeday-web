const { test } = require('@playwright/test');

const DataHelper = require('./helpers/data.helper');
const GlobalHelper = require('./helpers/global.helper');
const AuthHelper = require('./helpers/auth.helper');
const Lang = require('./helpers/lang.helper');

const assertNotFound = async (page) => {
    await page.waitForSelector(`#content .page-not-found:has-text("${Lang.text('nav.notFound')}")`);
    await page.waitForSelector('#content .bp3-icon[icon="path-search"]');
    await GlobalHelper.assertFooter(page);
};

test.describe('[Page not found]', () => {
    test('Initializing tests', async ({ page }) => {
        await page.setDefaultTimeout(5000);
        await DataHelper.resetAuth();
        await DataHelper.resetData();
        await GlobalHelper.login(page);
        await GlobalHelper.changeLanguage(page, 'en');
    });

    test('Should display page not found', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/fakePage'));
        await assertNotFound(page);
        await page.goto(GlobalHelper.url('/daysoff'));
        await GlobalHelper.setFilter(page, {
            start: '2019-12-01',
            end: '2019-12-31'
        });
        await GlobalHelper.assertFilter(page, ['start', 'end']);
        await page.goto(GlobalHelper.url('/anotherFakePage'));
        await assertNotFound(page);
        await GlobalHelper.logout(page);
        await page.goto(GlobalHelper.url('/anotherFakePage'));
        await AuthHelper.assertLoginPage(page);
    });
});
