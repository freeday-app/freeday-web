const { expect } = require('chai');
const { test } = require('@playwright/test');

const DataHelper = require('./helpers/data.helper.js');
const GlobalHelper = require('./helpers/global.helper.js');
const ConfigHelper = require('./helpers/config.helper.js');
const ConfigDayoffTypesHelper = require('./helpers/configDayoffTypes.helper.js');
const Lang = require('./helpers/lang.helper.js');

const getByValue = (listOfObj, key, val) => (
    listOfObj.filter((obj) => obj[key] === val).shift()
);

const getList = (dayoffTypes) => dayoffTypes.map((dt) => [
    { type: 'tooltip', value: dt.name },
    { type: 'emoji', value: dt.emoji },
    { type: 'tick', value: dt.enabled },
    { type: 'tick', value: dt.displayed },
    { type: 'tick', value: dt.important }
]);

test.describe('[Dayoff types configuration]', () => {
    test('Initializing tests', async ({ page }) => {
        await page.setDefaultTimeout(5000);
        await DataHelper.resetAuth();
        await DataHelper.resetData();
        await GlobalHelper.login(page);
        await GlobalHelper.changeLanguage(page, 'en');
    });

    test('Should have everything in its right place', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/config/types'));
        await ConfigHelper.assertPage(page, 'types');
        await GlobalHelper.assertSelectedNavButton(page, '/config/types');
        const dayoffTypes = await DataHelper.getDayoffTypes();
        await ConfigHelper.assertList(
            page,
            getList(dayoffTypes),
            ['edit']
        );
    });

    test('Should open dayoff type forms', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/config/types'));
        await ConfigHelper.create(page, 'dayoffType');
        await ConfigDayoffTypesHelper.assertForm(page);
        await ConfigDayoffTypesHelper.assertFormButtons(page);
        await ConfigDayoffTypesHelper.assertFormSwitches(page);
        await ConfigHelper.cancel(page);
        const dayoffTypes = await DataHelper.getDayoffTypes();
        for (const dt of dayoffTypes) {
            await ConfigHelper.edit(page, dt.id);
            await ConfigDayoffTypesHelper.assertForm(page, dt);
            await ConfigDayoffTypesHelper.assertFormButtons(page);
            await ConfigDayoffTypesHelper.assertFormSwitches(page);
            await ConfigHelper.cancel(page);
        }
        await ConfigHelper.create(page, 'dayoffType');
        await ConfigDayoffTypesHelper.assertForm(page);
        await ConfigDayoffTypesHelper.assertFormButtons(page);
        await ConfigDayoffTypesHelper.assertFormSwitches(page);
        await ConfigHelper.cancel(page);
    });

    test('Should create a new dayoff type', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/config/types'));
        const createData = [{
            name: `A_${Date.now().toString()}`,
            emoji: 'upside_down_face',
            enabled: true,
            displayed: true,
            important: true
        }, {
            name: `B_${Date.now().toString()}`,
            emoji: 'zipper_mouth_face',
            enabled: true,
            displayed: true,
            important: false
        }, {
            name: `C_${Date.now().toString()}`,
            emoji: null,
            enabled: false,
            displayed: true,
            important: true
        }, {
            name: `D_${Date.now().toString()}`,
            emoji: 'triumph',
            enabled: false,
            displayed: false,
            important: false
        }];
        const createDataByName = {};
        for (const dt of createData) {
            createDataByName[dt.name] = dt;
        }
        for (const data of createData) {
            await ConfigHelper.create(page, 'dayoffType');
            await ConfigDayoffTypesHelper.fillAndSubmitForm(page, data, true);
        }
        const dayoffTypes = await DataHelper.getDayoffTypes();
        const createdDayoffTypes = dayoffTypes.filter((dt) => (
            Object.keys(createDataByName).includes(dt.name)
        ));
        expect(createdDayoffTypes).to.have.lengthOf(createData.length);
        for (const dt of createdDayoffTypes) {
            ConfigDayoffTypesHelper.assertData(
                dt,
                createDataByName[dt.name]
            );
        }
        const dayoffTypesBis = await DataHelper.getDayoffTypes();
        await ConfigHelper.assertList(
            page,
            getList(dayoffTypesBis),
            ['edit']
        );
    });

    test('Should limit dayoff type name length', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/config/types'));
        await ConfigHelper.create(page, 'dayoffType');
        await ConfigDayoffTypesHelper.dayoffTypeName(
            page,
            'This name is way too long and should not exist for any possible reason on earth'
        );
        await ConfigDayoffTypesHelper.assertDayoffTypeNameValue(
            page,
            'This name is way too long and should not exist for any possible reason on e'
        );
        await ConfigHelper.cancel(page);
    });

    test('Should edit a dayoff type', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/config/types'));
        const randomString = Date.now().toString();
        const newRandomString = `New_${randomString}`;
        await ConfigHelper.create(page, 'dayoffType');
        await ConfigDayoffTypesHelper.fillAndSubmitForm(page, {
            name: randomString,
            emoji: 'no_mouth',
            enabled: false,
            displayed: false,
            important: false
        }, true);
        const dayoffTypes = await DataHelper.getDayoffTypes();
        const dayoffType = getByValue(dayoffTypes, 'name', randomString);
        await ConfigHelper.edit(page, dayoffType.id);
        await ConfigDayoffTypesHelper.assertForm(page, {
            name: randomString,
            emoji: 'no_mouth',
            enabled: false,
            displayed: false,
            important: false
        });
        await ConfigDayoffTypesHelper.fillAndSubmitForm(page, {
            name: newRandomString,
            emoji: null,
            enabled: true,
            displayed: true,
            important: true
        });
        await ConfigHelper.edit(page, dayoffType.id);
        await ConfigDayoffTypesHelper.assertForm(page, {
            name: newRandomString,
            emoji: null,
            enabled: true,
            displayed: true,
            important: true
        });
        await ConfigDayoffTypesHelper.fillAndSubmitForm(page, {
            name: newRandomString,
            emoji: 'dizzy_face',
            enabled: false,
            displayed: true,
            important: false
        });
        const dayoffTypesBis = await DataHelper.getDayoffTypes();
        await ConfigHelper.assertList(
            page,
            getList(dayoffTypesBis),
            ['edit']
        );
        await ConfigHelper.edit(page, dayoffType.id);
        await ConfigDayoffTypesHelper.assertForm(page, {
            name: newRandomString,
            emoji: 'dizzy_face',
            enabled: false,
            displayed: true,
            important: false
        });
        await ConfigHelper.cancel(page);
    });

    test('Should throw conflict error when creating & editing type with name already taken', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/config/types'));
        const dayoffTypes = await DataHelper.getDayoffTypes();
        await ConfigHelper.create(page, 'dayoffType');
        const createData = JSON.parse(JSON.stringify(dayoffTypes[0]));
        delete createData.id;
        createData.name = createData.name.toLowerCase();
        await ConfigDayoffTypesHelper.fillAndSubmitForm(
            page,
            createData,
            true,
            false,
            false
        );
        await GlobalHelper.assertToaster(page, 'error', Lang.text('dayoffType.error.conflict'));
        await ConfigHelper.cancel(page);
        await ConfigHelper.edit(page, dayoffTypes[0].id);
        const editData = JSON.parse(JSON.stringify(dayoffTypes[1]));
        delete editData.id;
        editData.name = editData.name.toLowerCase();
        await ConfigDayoffTypesHelper.fillAndSubmitForm(
            page,
            editData,
            false,
            false,
            false
        );
        await GlobalHelper.assertToaster(page, 'error', Lang.text('dayoffType.error.conflict'));
        await ConfigHelper.cancel(page);
    });
});
