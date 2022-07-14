const DayJS = require('dayjs');
const { test } = require('@playwright/test');

const DataHelper = require('./helpers/data.helper');
const GlobalHelper = require('./helpers/global.helper');
const DaysoffHelper = require('./helpers/daysoff.helper');
const Lang = require('./helpers/lang.helper');

test.describe('[Daysoff]', () => {
    test('Initializing tests', async ({ page }) => {
        await page.setDefaultTimeout(5000);
        await DataHelper.resetAuth();
        await DataHelper.resetData();
        await GlobalHelper.login(page);
        await GlobalHelper.changeLanguage(page, 'en');
        await GlobalHelper.assertFooter(page);
    });

    test('Should have everything in its right place', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/daysoff'));
        await GlobalHelper.setFilter(page, {
            start: '2019-12-01',
            end: '2019-12-31'
        });
        await DaysoffHelper.assertPage(page);
        await GlobalHelper.assertSelectedNavButton(page, '/daysoff');
    });

    test('Should display tooltip on daysoff table', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/daysoff'));
        const daysoff = await DataHelper.getDaysoff('2019-12-01', '2019-12-31');
        await GlobalHelper.setFilter(page, {
            start: '2019-12-01',
            end: '2019-12-31'
        });
        await DaysoffHelper.assertList(page, daysoff, null, true);
    });

    test('Should list all daysoff and sort them properly regardless of the date format', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/daysoff'));
        for (const lang of ['fr', 'en']) {
            await GlobalHelper.changeLanguage(page, lang);
            const daysoff = await DataHelper.getDaysoff();
            await GlobalHelper.setFilter(page, {
                start: '2018-01-01',
                end: '2020-12-31'
            });
            await DaysoffHelper.assertList(page, daysoff, null);
        }
    });

    test('Should filter daysoff by date', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/daysoff'));
        const daysoffNov = await DataHelper.getDaysoff('2019-11-01', '2019-11-30');
        const daysoffDec = await DataHelper.getDaysoff('2019-12-01', '2019-12-31');
        await GlobalHelper.setFilter(page, {
            start: '2019-11-01',
            end: '2019-11-30'
        });
        await DaysoffHelper.assertList(page, daysoffNov, null);
        await GlobalHelper.setFilter(page, {
            start: '2019-12-01',
            end: '2019-12-31'
        });
        await DaysoffHelper.assertList(page, daysoffDec, null);
    });

    test('Should filter daysoff by Slack users', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/daysoff'));
        const names = ['John Marston', 'Sadie Adler'];
        const moreNames = [...names, 'Arthur Morgan'];
        const daysoff = await DataHelper.getDaysoff('2019-12-01', '2019-12-31', names);
        const daysoffBis = await DataHelper.getDaysoff('2019-12-01', '2019-12-31', moreNames);
        await GlobalHelper.setFilter(page, {
            start: '2019-12-01',
            end: '2019-12-31',
            slackUsers: names
        });
        await DaysoffHelper.assertList(page, daysoff);
        await GlobalHelper.clearSelects(page);
        await GlobalHelper.setFilter(page, {
            slackUsers: moreNames
        });
        await DaysoffHelper.assertList(page, daysoffBis);
    });

    test('Should filter daysoff by dayoff type', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/daysoff'));
        const dayoffTypes = await DataHelper.getDayoffTypes(true);
        const daysoff = await DataHelper.getDaysoff(
            '2019-12-01',
            '2019-12-31',
            null,
            dayoffTypes[0].id
        );
        await GlobalHelper.clearSelects(page);
        await GlobalHelper.setFilter(page, {
            start: '2019-12-01',
            end: '2019-12-31',
            type: dayoffTypes[0].name
        });
        await DaysoffHelper.assertList(page, daysoff);
    });

    test('Should change dayoff status', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/daysoff'));
        const daysoff = await DataHelper.getDaysoff('2019-12-01', '2019-12-31');
        await GlobalHelper.clearSelects(page, true);
        await GlobalHelper.setFilter(page, {
            start: '2019-12-01',
            end: '2019-12-31'
        });
        await DaysoffHelper.assertList(page, daysoff);
        await DaysoffHelper.changeAndAssertStatus(
            page,
            0,
            Lang.text('button.confirm'),
            Lang.text('dayoff.status.confirmed')
        );
        await DaysoffHelper.changeAndAssertStatus(
            page,
            1,
            Lang.text('button.cancel'),
            Lang.text('dayoff.status.canceled'),
            'Random reason'
        );
        await DaysoffHelper.changeAndAssertStatus(
            page,
            2,
            Lang.text('button.confirm'),
            Lang.text('dayoff.status.confirmed')
        );
        await DaysoffHelper.changeAndAssertStatus(
            page,
            2,
            Lang.text('button.reset'),
            Lang.text('dayoff.status.pending')
        );
    });

    test('Should handle conflicts', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/daysoff'));
        const daysoffNov = await DataHelper.getDaysoff('2019-11-01', '2019-11-30');
        const createdDayoff = await DataHelper.createDayoff({
            type: daysoffNov[0].type.id,
            slackUserId: daysoffNov[0].slackUser.slackId,
            start: DayJS(daysoffNov[0].start).format('YYYY-MM-DD'),
            end: DayJS(daysoffNov[0].end).format('YYYY-MM-DD')
        }, true);
        const daysoffNovBis = await DataHelper.getDaysoff('2019-11-01', '2019-11-30');
        await GlobalHelper.setFilter(page, {
            start: '2019-11-01',
            end: '2019-11-30'
        });
        await DaysoffHelper.assertList(page, daysoffNovBis);
        await DaysoffHelper.handleConflict(page, createdDayoff.id);
    });

    test('Should filter daysoff by status', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/daysoff'));
        const daysoff = await DataHelper.getDaysoff('2019-12-01', '2019-12-31');
        await GlobalHelper.setFilter(page, {
            start: '2019-12-01',
            end: '2019-12-31'
        });
        await DaysoffHelper.assertList(page, daysoff);
        await GlobalHelper.setFilter(page, {
            status: Lang.text('dayoff.status.confirmed')
        });
        await DaysoffHelper.assertList(page, [daysoff[0]], Lang.text('dayoff.status.confirmed'));
        await GlobalHelper.setFilter(page, {
            status: Lang.text('dayoff.status.canceled')
        });
        await DaysoffHelper.assertList(page, [daysoff[1]], Lang.text('dayoff.status.canceled'));
        await GlobalHelper.setFilter(page, {
            status: Lang.text('dayoff.status.pending')
        });
        await DaysoffHelper.assertList(page, [daysoff[2], daysoff[3]], Lang.text('dayoff.status.pending'));
    });

    test('Should save filter', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/daysoff'));
        const dayoffTypes = await DataHelper.getDayoffTypes(true);
        for (const filter of [{
            start: '2019-11-01',
            end: '2019-11-30',
            slackUsers: ['John Marston', 'Sadie Adler'],
            type: dayoffTypes[0].name,
            status: Lang.text('dayoff.status.confirmed')
        }, {
            start: '2019-12-01',
            end: '2019-12-31',
            slackUsers: ['Arthur Morgan', 'Sadie Adler'],
            type: dayoffTypes[1].name,
            status: Lang.text('dayoff.status.canceled')
        }]) {
            await GlobalHelper.clearSelects(page);
            await GlobalHelper.setFilter(page, filter, 'getDaysoff');
            await GlobalHelper.visitPageThroughMenu(page, 'schedule');
            await GlobalHelper.visitPageThroughMenu(page, 'summary');
            await GlobalHelper.visitPageThroughMenu(page, 'daysoff');
            await GlobalHelper.assertFilterValues(page, filter);
        }
    });

    test('Should reset filters after logging out', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/daysoff'));
        const dayoffTypes = await DataHelper.getDayoffTypes(true);
        const defaultFilter = {
            start: DayJS().startOf('month').format('YYYY-MM-DD'),
            end: DayJS().endOf('month').format('YYYY-MM-DD'),
            slackUser: [],
            type: '',
            status: ''
        };
        const filter = {
            start: '2019-01-07',
            end: '2019-01-21',
            slackUsers: ['John Marston', 'Sadie Adler'],
            type: dayoffTypes[0].name,
            status: Lang.text('dayoff.status.confirmed')
        };
        await GlobalHelper.clearSelects(page);
        await GlobalHelper.setFilter(page, filter, 'getDaysoff');
        await GlobalHelper.logout(page);
        await GlobalHelper.login(page);
        await GlobalHelper.assertFilterValues(page, defaultFilter);
    });

    test('Should filter daysoff by multiple criteria then reset filter', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/daysoff'));
        const dayoffTypes = await DataHelper.getDayoffTypes(true);
        await GlobalHelper.clearSelects(page);
        const names = ['Arthur Morgan', 'John Marston', 'Sadie Adler'];
        const daysoff = await DataHelper.getDaysoff('2019-12-01', '2019-12-31', names, dayoffTypes[0].id);
        await GlobalHelper.setFilter(page, {
            start: '2019-12-01',
            end: '2019-12-31',
            slackUsers: names,
            type: dayoffTypes[0].name,
            status: Lang.text('dayoff.status.canceled')
        });
        await DaysoffHelper.assertList(page, [daysoff[0]], Lang.text('dayoff.status.canceled'));
        await GlobalHelper.resetFilter(page);
        const currentStart = DayJS().startOf('month').format('YYYY-MM-DD');
        const currentEnd = DayJS().endOf('month').format('YYYY-MM-DD');
        await GlobalHelper.assertFilterValues(page, {
            start: currentStart,
            end: currentEnd
        });
        const daysoffNov = await DataHelper.getDaysoff('2019-11-01', '2019-11-30');
        await GlobalHelper.setFilter(page, {
            start: '2019-11-01',
            end: '2019-11-30'
        });
        await DaysoffHelper.assertList(page, daysoffNov);
    });

    test('Should create a dayoff', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/daysoff'));
        const daysoff = await DataHelper.getDaysoff('2019-12-01', '2019-12-31');
        await DataHelper.deleteDayoff(daysoff[0]);
        await GlobalHelper.clearSelects(page);
        await GlobalHelper.setFilter(page, {
            start: '2019-12-01',
            end: '2019-12-31'
        });
        await DaysoffHelper.create(page);
        await GlobalHelper.clickDialogButton(page, Lang.text('button.cancel'));
        await page.waitForSelector('.bp3-dialog', { state: 'detached' });
        await DaysoffHelper.create(page);
        await DaysoffHelper.assertForm(page);
        await GlobalHelper.clickDialogButton(page, Lang.text('button.confirm'));
        await DaysoffHelper.assertFormErrors(page);
        await DaysoffHelper.fillForm(page, daysoff[0], false, true);
        const ds = await DataHelper.getDaysoff('2019-12-01', '2019-12-31');
        await DaysoffHelper.assertList(page, ds);
        await DaysoffHelper.editFirstRow(page);
        await DaysoffHelper.assertForm(page, true);
        await GlobalHelper.clickDialogButton(page, Lang.text('button.cancel'));
    });

    test('Should edit a dayoff', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/daysoff'));
        const dayoffTypes = await DataHelper.getDayoffTypes(true);
        const ds = await DataHelper.getDaysoff('2019-12-01', '2019-12-31');
        const daysoff = ds;
        await GlobalHelper.clearSelects(page);
        await GlobalHelper.setFilter(page, {
            start: '2019-12-01',
            end: '2019-12-31'
        });
        await DaysoffHelper.editFirstRow(page, Lang.text('button.cancel'));
        await DaysoffHelper.editFirstRow(page);
        await DaysoffHelper.assertForm(page, true);
        await DaysoffHelper.assertFormValues(page, daysoff[0]);
        daysoff[0] = {
            ...daysoff[0],
            type: dayoffTypes.filter((dt) => (
                dt.id !== daysoff[0].type.id
            )).shift(),
            start: '2019-11-28',
            end: '2019-12-03',
            startPeriod: 'pm',
            endPeriod: 'am',
            count: '3',
            comment: 'edited'
        };
        await DaysoffHelper.fillForm(page, daysoff[0], true, true);
        await DaysoffHelper.assertList(page, daysoff);
        await DaysoffHelper.create(page);
        await DaysoffHelper.assertForm(page);
        await GlobalHelper.clickDialogButton(page, Lang.text('button.cancel'));
    });

    test('Should scroll and still see table header', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/daysoff'));
        await GlobalHelper.setFilter(page, {
            start: '2019-01-01',
            end: '2019-12-31'
        });
        await DaysoffHelper.assertFixedHeader(page);
    });
});
