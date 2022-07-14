const { expect } = require('chai');

const DataHelper = require('./data.helper');
const APIHelper = require('./api.helper');
const GlobalHelper = require('./global.helper');
const Lang = require('./lang.helper');

const WelcomeHelper = {

    // initiates welcome and gets on welcome page
    async initiate(page) {
        await DataHelper.deleteOtherUsers();
        const response = await APIHelper.request({
            method: 'put',
            url: '/api/auth/welcome'
        });
        const { secret } = response.data;
        await page.goto(GlobalHelper.url(`/welcome/${secret}`));
    },

    // asserts welcome intro page content
    async assertIntro(page) {
        await page.waitForSelector(`.welcome-intro-title:has-text("${Lang.text('welcome.intro')}")`);
        await page.waitForSelector(`.welcome-intro-button:has-text("${Lang.text('button.start')}")`);
    },

    // skip welcome intro
    async skipIntro(page) {
        await page.click(`.welcome-intro-button:has-text("${Lang.text('button.start')}")`);
    },

    // asserts welcome language selection page
    async assertLanguageSelection(page) {
        await page.waitForSelector(`.welcome-title:has-text("${Lang.text('welcome.selectLanguage')}")`);
        for (const code of Object.keys(Lang.languages)) {
            const name = Lang.languages[code];
            await page.waitForSelector(
                `.welcome-language-list .welcome-language-item:has(.welcome-language-name:has-text("${name}")) .emoji-mart-emoji`
            );
        }
    },

    // select welcome language
    async selectLanguage(page, langCode) {
        const name = Lang.languages[langCode];
        await page.click(
            `.welcome-language-list .welcome-language-item:has(.welcome-language-name:has-text("${name}"))`
        );
    },

    // asserts welcome user creation page
    async assertUserCreation(page) {
        await page.waitForSelector(`.welcome-title:has-text("${Lang.text('welcome.createUser')}")`);
        await page.waitForSelector(
            `.login-form .bp4-input-group:has(span[icon="user"]) input[type="text"][name="username"][placeholder="${
                Lang.text('admin.form.username')
            }"]`
        );
        await page.waitForSelector(
            `.login-form .bp4-input-group:has(span[icon="lock"]) input[type="password"][name="password"][placeholder="${
                Lang.text('admin.form.password')
            }"]`
        );
        await page.waitForSelector(
            `.login-form button.bp4-intent-primary:has(span[icon="add"]) .bp4-button-text:has-text("${
                Lang.text('button.create')
            }")`
        );
        const inputSelector = '.login-form .bp4-input-group input[name="xxx"]';
        const usernameSelector = inputSelector.replace('xxx', 'username');
        const passwordSelector = inputSelector.replace('xxx', 'password');
        const assertEnabled = async () => {
            const isEnabled = await page.isEnabled('.login-form button.bp4-intent-primary');
            expect(isEnabled).to.be.true;
            await page.$eval('.login-form button.bp4-intent-primary', (el) => (
                !el.classList.contains('bp4-disabled')
            ));
        };
        const assertDisabled = async () => {
            const isEnabled = await page.isEnabled('.login-form button.bp4-intent-primary');
            expect(isEnabled).to.be.false;
            await page.$eval('.login-form button.bp4-intent-primary', (el) => (
                el.classList.contains('bp4-disabled')
            ));
        };
        await page.fill(usernameSelector, '');
        await page.fill(passwordSelector, '');
        await assertDisabled();
        await page.fill(usernameSelector, 'xxx');
        await page.fill(passwordSelector, '');
        await assertDisabled();
        await page.fill(usernameSelector, '');
        await page.fill(passwordSelector, 'xxx');
        await assertDisabled();
        await page.fill(usernameSelector, 'xxx');
        await page.fill(passwordSelector, 'xxx');
        await assertDisabled();
        await page.fill(usernameSelector, 'xxxxxx');
        await page.fill(passwordSelector, 'xxx');
        await assertDisabled();
        await page.fill(usernameSelector, 'xxx');
        await page.fill(passwordSelector, 'xxxxxx');
        await assertDisabled();
        await page.fill(usernameSelector, 'xxxxxx');
        await page.fill(passwordSelector, 'xxxxxx');
        await assertEnabled();
    },

    // fills and submit welcome user form
    async createUser(page, username, password) {
        await page.fill(
            `.login-form input[type="text"][name="username"][placeholder="${Lang.text('admin.form.username')}"]`,
            username
        );
        await page.fill(
            `.login-form input[type="password"][name="password"][placeholder="${Lang.text('admin.form.password')}"]`,
            password
        );
        await page.click(
            `.login-form button.bp4-intent-primary:has(.bp4-button-text:has-text("${Lang.text('button.create')}"))`
        );
    }

};

module.exports = WelcomeHelper;
