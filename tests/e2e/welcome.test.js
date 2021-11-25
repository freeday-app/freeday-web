const { test } = require('@playwright/test');

const DataHelper = require('./helpers/data.helper.js');
const GlobalHelper = require('./helpers/global.helper.js');
const WelcomeHelper = require('./helpers/welcome.helper.js');
const AuthData = require('./data/auth.json');

test.describe('[Welcome]', () => {
    test('Initializing tests', async ({ page }) => {
        await page.setDefaultTimeout(5000);
        await DataHelper.resetAuth();
        await DataHelper.resetData();
        await GlobalHelper.login(page);
        await GlobalHelper.changeLanguage(page, 'en');
    });

    test('Should do the welcome course', async ({ page }) => {
        await WelcomeHelper.initiate(page);
        await WelcomeHelper.assertIntro(page);
        await WelcomeHelper.skipIntro(page);
        await WelcomeHelper.assertLanguageSelection(page);
        await WelcomeHelper.selectLanguage(page, 'en');
        await WelcomeHelper.assertUserCreation(page);
        await WelcomeHelper.createUser(page, AuthData.username, AuthData.password);
        await GlobalHelper.assertLogged(page);
        await DataHelper.resetAuth();
        await DataHelper.resetData();
        await GlobalHelper.login(page);
    });
});
