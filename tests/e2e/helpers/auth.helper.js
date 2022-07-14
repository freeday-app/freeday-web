const { expect } = require('chai');

const GlobalHelper = require('./global.helper');
const Lang = require('./lang.helper');
const ConfigurationData = require('../data/configuration.json');

const AuthHelper = {

    // fill login form
    async fillLoginForm(page, username, password) {
        await page.click('.login-form input[name="username"]');
        await page.keyboard.press('Backspace');
        await page.fill('.login-form input[name="username"]', username || '');
        await page.click('.login-form input[name="password"]');
        await page.keyboard.press('Backspace');
        await page.fill('.login-form input[name="password"]', password || '');
    },

    // checks login button status (enabled/disabled)
    async assertLoginButtonStatus(page, isEnabled = true) {
        const enabled = await page.isEnabled('.login-form button[type="submit"]');
        expect(enabled).to.equal(isEnabled);
    },

    // submits login form
    async submitLogin(page) {
        await page.click('.login-form button[type="submit"]');
    },

    // checks login page elements
    async assertLoginPage(
        page,
        brandingName = ConfigurationData.brandingName,
        brandingLogoBase64 = ConfigurationData.brandingLogo
    ) {
        await page.waitForSelector('.login-form .login-header');
        if (brandingLogoBase64) {
            const base64 = await page.getAttribute('.login-form .login-header .login-header-logo img', 'src');
            expect(base64).to.equal(brandingLogoBase64);
        } else {
            await GlobalHelper.containsEmoji(page, '.login-form .login-header .login-header-logo', 'palm_tree');
        }
        const headerText = await page.textContent('.login-form .login-header h1');
        expect(headerText).to.equal(`Freeday${brandingName ? ` ${brandingName}` : ''}`);
        await page.waitForSelector('.login-form .bp3-input-group span[icon="user"]');
        await page.waitForSelector(
            `.login-form .bp3-input-group input[type="text"][name="username"][placeholder="${Lang.text('admin.form.username')}"]`
        );
        await page.waitForSelector('.login-form .bp3-input-group span[icon="lock"]');
        await page.waitForSelector(
            `.login-form .bp3-input-group input[type="password"][name="password"][placeholder="${Lang.text('admin.form.password')}"]`
        );
        await page.waitForSelector('button.bp3-intent-primary span[icon="log-in"]');
        await page.waitForSelector(
            `.login-form .bp3-input-group input[type="password"][name="password"][placeholder="${Lang.text('admin.form.password')}"]`
        );
        const buttonContent = await page.textContent('.login-form button.bp3-intent-primary .bp3-button-text');
        expect(buttonContent).to.equal(Lang.text('login.submit'));
    }

};

module.exports = AuthHelper;
