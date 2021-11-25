const { expect } = require('chai');
const { test } = require('@playwright/test');

const DataHelper = require('./helpers/data.helper.js');
const GlobalHelper = require('./helpers/global.helper.js');
const ConfigHelper = require('./helpers/config.helper.js');
const ConfigAdminHelper = require('./helpers/configAdmin.helper.js');
const Lang = require('./helpers/lang.helper.js');

const getByValue = (listOfObj, key, val) => (
    listOfObj.filter((obj) => obj[key] === val).shift()
);

test.describe('[Administrators configuration]', () => {
    test('Initializing tests', async ({ page }) => {
        await page.setDefaultTimeout(5000);
        await DataHelper.resetAuth();
        await DataHelper.resetData();
        await DataHelper.deleteTestUsers();
        await GlobalHelper.login(page);
        await GlobalHelper.changeLanguage(page, 'en');
    });

    test('Should have everything in its right place', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/config/admins'));
        await ConfigHelper.assertPage(page, 'admins');
        await GlobalHelper.assertSelectedNavButton(page, '/config/admins');
        const users = await DataHelper.getUsers();
        await ConfigHelper.assertList(
            page,
            users.map((u) => [{
                type: 'tooltip',
                value: u.username
            }]),
            ['edit', 'delete']
        );
    });

    test('Should open administrator forms', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/config/admins'));
        const users = await DataHelper.getUsers();
        const user = users.pop();
        await ConfigHelper.create(page, 'admin');
        await ConfigAdminHelper.assertForm(page);
        await ConfigAdminHelper.assertFormButtons(page);
        await ConfigHelper.cancel(page);
        await ConfigHelper.edit(page, user.id);
        await ConfigAdminHelper.assertForm(page, user.username);
        await ConfigAdminHelper.assertFormButtons(page);
        await ConfigHelper.cancel(page);
    });

    test('Should create a new administrator', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/config/admins'));
        const randomString = Date.now().toString();
        await ConfigHelper.create(page, 'admin');
        await ConfigAdminHelper.fillAndSubmitForm(
            page,
            randomString,
            randomString,
            randomString,
            true
        );
        const users = await DataHelper.getUsers();
        await ConfigHelper.assertList(
            page,
            users.map((u) => [{
                type: 'tooltip',
                value: u.username
            }]),
            ['edit', 'delete']
        );
        const user = getByValue(users, 'username', randomString);
        await ConfigHelper.edit(page, user.id);
        await ConfigAdminHelper.assertForm(page, randomString);
        await ConfigHelper.cancel(page);
    });

    test('Should edit an administrator', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/config/admins'));
        const randomString = Date.now().toString();
        const newRandomString = `new${randomString}`;
        const renewRandomString = `renew${randomString}`;
        await ConfigHelper.create(page, 'admin');
        await ConfigAdminHelper.fillAndSubmitForm(
            page,
            randomString,
            randomString,
            randomString,
            true
        );
        const users = await DataHelper.getUsers();
        const user = getByValue(users, 'username', randomString);
        await ConfigHelper.edit(page, user.id);
        await ConfigAdminHelper.assertForm(page, randomString);
        await ConfigAdminHelper.fillAndSubmitForm(page, newRandomString, '', '');
        await ConfigHelper.edit(page, user.id);
        await ConfigAdminHelper.assertForm(page, newRandomString);
        await ConfigAdminHelper.fillAndSubmitForm(
            page,
            renewRandomString,
            newRandomString,
            newRandomString
        );
        const usersBis = await DataHelper.getUsers();
        await ConfigHelper.assertList(
            page,
            usersBis.map((u) => [{
                type: 'tooltip',
                value: u.username
            }]),
            ['edit', 'delete']
        );
        const userBis = getByValue(usersBis, 'username', renewRandomString);
        await ConfigHelper.edit(page, userBis.id);
        await ConfigAdminHelper.assertForm(page, renewRandomString);
        await ConfigHelper.cancel(page);
    });

    test('Should delete an administrator', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/config/admins'));
        const randomString = Date.now().toString();
        await ConfigHelper.create(page, 'admin');
        await ConfigAdminHelper.fillAndSubmitForm(
            page,
            randomString,
            randomString,
            randomString,
            true
        );
        const users = await DataHelper.getUsers();
        const user = getByValue(users, 'username', randomString);
        await ConfigHelper.delete(page, user.id);
        await ConfigAdminHelper.assertDeleteDialog(page, user.username);
        await ConfigAdminHelper.cancelDelete(page);
        await ConfigHelper.delete(page, user.id);
        await ConfigAdminHelper.assertDeleteDialog(page, user.username);
        await ConfigAdminHelper.confirmDelete(page);
        const usersBis = await DataHelper.getUsers(page);
        expect(usersBis).to.have.length.below(users.length);
        await ConfigHelper.assertList(
            page,
            usersBis.map((u) => [{
                type: 'tooltip',
                value: u.username
            }]),
            ['edit', 'delete']
        );
    });

    test('Should truncate long administrator names', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/config/admins'));
        const admin = 'très très très très grand& manitou';
        await ConfigHelper.create(page, 'admin');
        await ConfigAdminHelper.fillAndSubmitForm(page, admin, admin, admin, true);
        const users = await DataHelper.getUsers();
        await ConfigHelper.assertList(
            page,
            users.map((u) => [{
                type: 'tooltip',
                value: u.username
            }]),
            ['edit', 'delete']
        );
    });

    test('Should throw conflict error when creating & editing user with username already taken', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/config/admins'));
        const users = await DataHelper.getUsers();
        const randomString = Date.now().toString();
        await ConfigHelper.create(page, 'admin');
        await ConfigAdminHelper.fillAndSubmitForm(
            page,
            users[0].username,
            randomString,
            randomString,
            true,
            false,
            false
        );
        await GlobalHelper.assertToaster(page, 'error', Lang.text('admin.error.username'));
        await ConfigHelper.cancel(page);
        await ConfigHelper.edit(page, users[0].id);
        await ConfigAdminHelper.fillAndSubmitForm(
            page,
            users[1].username,
            randomString,
            randomString,
            false,
            false,
            false
        );
        await GlobalHelper.assertToaster(page, 'error', Lang.text('admin.error.username'));
        await ConfigHelper.cancel(page);
    });
});
