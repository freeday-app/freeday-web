const { test } = require('@playwright/test');
const DataHelper = require('./helpers/data.helper.js');
const GlobalHelper = require('./helpers/global.helper.js');
const AuthHelper = require('./helpers/auth.helper.js');
const Lang = require('./helpers/lang.helper.js');

test.describe('[Authentication]', () => {
    test('Initializing tests', async ({ page }) => {
        await page.setDefaultTimeout(5000);
        await DataHelper.resetAuth();
        await DataHelper.resetData();
    });

    test('Should have everything in its right place', async ({ page }) => {
        await DataHelper.setConfiguration({
            brandingName: null,
            brandingLogo: null
        });
        await page.goto(GlobalHelper.url('/login'));
        await AuthHelper.assertLoginPage(page, null, null);
        await DataHelper.setConfiguration();
        await page.goto(GlobalHelper.url('/login'));
        await AuthHelper.assertLoginPage(page);
    });

    test('Should enable or disable login button while editing inputs', async ({ page }) => {
        await page.goto(GlobalHelper.url('/login'));
        await AuthHelper.fillLoginForm(page, '', '');
        await AuthHelper.assertLoginButtonStatus(page, false);
        await AuthHelper.fillLoginForm(page, 'some', 'thing');
        await AuthHelper.assertLoginButtonStatus(page, true);
    });

    test('Should display error while trying to connect with wrong credentials', async ({ page }) => {
        await page.goto(GlobalHelper.url('/login'));
        await AuthHelper.fillLoginForm(page, 'wrong', 'login');
        await AuthHelper.submitLogin(page);
        await GlobalHelper.assertToaster(page, 'error', Lang.text('login.error.credentials'));
    });

    test('Should login and logout successfully', async ({ page }) => {
        await GlobalHelper.login(page);
        await GlobalHelper.logout(page);
        await page.goto(GlobalHelper.url('/daysoff'));
        await AuthHelper.assertLoginPage(page);
    });
});
