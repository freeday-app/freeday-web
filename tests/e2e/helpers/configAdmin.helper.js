const { expect } = require('chai');

const GlobalHelper = require('./global.helper.js');
const Lang = require('./lang.helper.js');

const ConfigAdminHelper = {

    // asserts user form
    async assertForm(page, username = null) {
        await page.waitForSelector(
            `#config-main h3:has-text("${
                username ? `${Lang.text('admin.edit')} ${username}` : Lang.text('admin.new')
            }")`
        );
        await page.waitForSelector('#config-main form.admin-form');
        // checks for hidden inputs (preventing auto completion from browser)
        await page.waitForSelector('.admin-form input.hidden[type="text"][name="fakeUsername"]', {
            state: 'hidden'
        });
        await page.waitForSelector('.admin-form input.hidden[type="password"][name="fakePassword"]', {
            state: 'hidden'
        });
        // checks username label and input
        const usernameInputSelector = (
            `.admin-form .bp3-form-group:has(.bp3-label:has-text("${
                Lang.text('admin.form.username')
            }")) .bp3-input-group:has(.bp3-icon-user) input.bp3-input`
        );
        await page.waitForSelector(usernameInputSelector);
        const usernameInputValue = await page.$eval(usernameInputSelector, (el) => el.value);
        expect(usernameInputValue).to.equal(username || '');
        // checks password label and input
        await page.waitForSelector(
            `.admin-form .bp3-form-group:has(.bp3-label:has-text("${
                Lang.text('admin.form.password')
            }")) .bp3-form-content .bp3-input-group:has(.bp3-icon-lock) input.bp3-input`
        );
        // checks password confirm label and input
        await page.waitForSelector(
            `.admin-form .bp3-form-group:has(.bp3-label:has-text("${
                Lang.text('admin.form.passwordConfirm')
            }")) .bp3-form-content .bp3-input-group:has(.bp3-icon-lock) input.bp3-input`
        );
        // checks for input helpers
        for (const inputName of ['username', 'password']) {
            await page.waitForSelector(
                `.admin-form .bp3-form-group:has(.bp3-label:has-text("${
                    Lang.text(`admin.form.${inputName}`)
                }")) .bp3-form-helper-text:has-text("${
                    [
                        Lang.text('admin.form.securityRule'),
                        inputName === 'password' && username
                            ? `, ${Lang.text('admin.form.passwordEmpty', false)}`
                            : ''
                    ].join('')
                }")`
            );
        }
        // checks buttons
        await page.waitForSelector(
            `.admin-form button.bp3-intent-primary:has(.bp3-icon-${
                username ? 'floppy-disk' : 'add'
            }) .bp3-button-text:has-text("${
                Lang.text(`button.${username ? 'save' : 'create'}`)
            }")`
        );
        await page.waitForSelector(
            `.admin-form button:has(.bp3-icon-undo) .bp3-button-text:has-text("${
                Lang.text('button.cancel')
            }")`
        );
    },

    // checks helper for non matching password is here
    async assertNonMatchingPasswordHelper(page, isHere = true) {
        await page.waitForSelector(
            `.admin-form .bp3-form-group .bp3-label:has-text("${
                Lang.text('admin.form.passwordConfirm')
            }")`
        );
        if (isHere) {
            await page.waitForSelector(
                `.admin-form .bp3-form-group .bp3-form-helper-text .helper-error:has-text("${
                    Lang.text('admin.form.passwordDontMatch')
                }")`
            );
        } else {
            await page.waitForSelector('.admin-form .bp3-form-group .bp3-form-helper-text .helper-error', {
                state: 'detached'
            });
        }
    },

    // checks user delete confirm dialog
    async assertDeleteDialog(page, username) {
        await page.waitForSelector(
            `.bp3-dialog .bp3-dialog-header:has(span[icon="warning-sign"]) h4.bp3-heading:has-text("${
                Lang.text('admin.dialog.delete.title')
            }")`
        );
        await page.waitForSelector(
            `.bp3-dialog .bp3-dialog-body:has-text("${Lang.text('admin.dialog.delete.text')} ${username} ?")`
        );
        await page.waitForSelector(
            `.bp3-dialog .bp3-dialog-footer button.bp3-button.bp3-intent-primary .bp3-button-text:has-text("${Lang.text('button.confirm')}")`
        );
    },

    // clicks confirm button in delete dialog
    async confirmDelete(page) {
        await Promise.all([
            page.click(
                `.bp3-dialog .bp3-dialog-footer button.bp3-button:has(.bp3-button-text:has-text("${Lang.text('button.confirm')}"))`
            ),
            GlobalHelper.waitAPI(page, 'deleteUser'),
            GlobalHelper.waitAPI(page, 'getUsers')
        ]);
    },

    // clicks cancel button in delete dialog
    async cancelDelete(page) {
        await page.click(
            `.bp3-dialog .bp3-dialog-footer button.bp3-button:has(.bp3-button-text:has-text("${Lang.text('button.cancel')}"))`
        );
    },

    // asserts user form button status (enabled / disabled)
    async assertFormButtons(page) {
        const inputSelector = '.admin-form .bp3-input-group input[name="xxx"]';
        const usernameSelector = inputSelector.replace('xxx', 'username');
        const passwordSelector = inputSelector.replace('xxx', 'password');
        const passwordConfirmSelector = inputSelector.replace('xxx', 'passwordConfirm');
        const assertEnabled = async () => {
            const enabled = await page.isEnabled('.admin-form button.bp3-intent-primary');
            expect(enabled).to.be.true;
            await page.$eval('.admin-form button.bp3-intent-primary', (el) => (
                !el.classList.contains('bp3-disabled')
            ));
        };
        const assertDisabled = async () => {
            const enabled = await page.isEnabled('.admin-form button.bp3-intent-primary');
            expect(enabled).to.be.false;
            await page.$eval('.admin-form button.bp3-intent-primary', (el) => (
                el.classList.contains('bp3-disabled')
            ));
        };
        const fillAndAssertForm = async (
            username = null,
            password = null,
            passwordConfirm = null,
            isNonMatchingHelper = false,
            isSubmitEnabled = true
        ) => {
            await page.fill(usernameSelector, username || '');
            await page.fill(passwordSelector, password || '');
            await page.fill(passwordConfirmSelector, passwordConfirm || '');
            await ConfigAdminHelper.assertNonMatchingPasswordHelper(
                page,
                isNonMatchingHelper
            );
            if (isSubmitEnabled) {
                await assertEnabled();
            } else {
                await assertDisabled();
            }
        };
        await fillAndAssertForm(null, null, null, false, false);
        await fillAndAssertForm('xxx', null, null, false, false);
        await fillAndAssertForm(null, 'xxx', 'xxx', false, false);
        await fillAndAssertForm(null, 'xxx', 'zzz', true, false);
        await fillAndAssertForm('xxx', 'xxx', 'xxx', false, false);
        await fillAndAssertForm('xxx', 'xxx', 'zzz', true, false);
        await fillAndAssertForm('xxxxxx', 'xxx', 'xxx', false, false);
        await fillAndAssertForm('xxx', 'xxxxxx', 'xxxxxx', false, false);
        await fillAndAssertForm('xxxxxx', 'xxxxxx', 'zzzzzz', true, false);
        await fillAndAssertForm('xxxxxx', 'xxxxxx', 'xxxxxx', false, true);
    },

    // fills user form with given data
    async fillAndSubmitForm(
        page,
        username = '',
        password = '',
        passwordConfirm = '',
        isCreate = false,
        assertToaster = true,
        waitListRoute = true
    ) {
        const usernameInputSelector = '.admin-form .bp3-input-group input[name="username"]';
        await page.fill(usernameInputSelector, username);
        const passwordInputSelector = '.admin-form .bp3-input-group input[name="password"]';
        await page.fill(passwordInputSelector, password);
        const passwordConfirmInputSelector = '.admin-form .bp3-input-group input[name="passwordConfirm"]';
        await page.fill(passwordConfirmInputSelector, passwordConfirm);
        const tasks = [
            page.click('.admin-form button.bp3-intent-primary'),
            GlobalHelper.waitAPI(page, isCreate ? 'createUser' : 'editUser')
        ];
        if (waitListRoute) {
            tasks.push(
                GlobalHelper.waitAPI(page, 'getUsers')
            );
        }
        await Promise.all(tasks);
        if (assertToaster) {
            await GlobalHelper.assertToaster(page, 'success', Lang.text(`admin.success.${isCreate ? 'create' : 'edit'}`));
        }
    }

};

module.exports = ConfigAdminHelper;
