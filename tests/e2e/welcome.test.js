const { test } = require('@playwright/test');

const APIHelper = require('./helpers/api.helper');
const DataHelper = require('./helpers/data.helper');
const GlobalHelper = require('./helpers/global.helper');
const WelcomeHelper = require('./helpers/welcome.helper');

test.describe('[Welcome]', () => {
    test('Initializing tests', async ({ page }) => {
        page.setDefaultTimeout(5000);
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
        await WelcomeHelper.createUser(page, APIHelper.username, APIHelper.password);
        await GlobalHelper.assertLogged(page);
        await DataHelper.resetAuth();
        await DataHelper.resetData();
        await GlobalHelper.login(page);
    });
});
