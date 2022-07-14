const DayJS = require('dayjs');
const { test } = require('@playwright/test');

const DataHelper = require('./helpers/data.helper');
const GlobalHelper = require('./helpers/global.helper');
const SummaryHelper = require('./helpers/summary.helper');

test.describe('[Summary]', () => {
    test('Initializing tests', async ({ page }) => {
        await page.setDefaultTimeout(5000);
        await DataHelper.resetAuth();
        await DataHelper.resetData();
        await DataHelper.takeActionOnAllDaysoff('confirm');
        await GlobalHelper.login(page);
        await GlobalHelper.changeLanguage(page, 'en');
        await GlobalHelper.assertFooter(page);
    });

    test('Should have everything in its right place', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/summary'));
        await GlobalHelper.setFilter(page, {
            start: '2019-11-01',
            end: '2019-11-30'
        });
        await SummaryHelper.assertPage(page);
        await GlobalHelper.setFilter(page, {
            start: '2019-12-01',
            end: '2019-12-31'
        });
        await SummaryHelper.assertPage(page);
        await GlobalHelper.assertSelectedNavButton(page, '/summary');
    });

    test('Should filter summary then reset filter', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/summary'));
        const filteredSlackUsers = ['Arthur Morgan', 'Sadie Adler'];
        const data1 = await SummaryHelper.getData('2019-11-01', '2019-11-30', 19);
        await GlobalHelper.setFilter(page, {
            start: '2019-11-01',
            end: '2019-11-30'
        });
        await SummaryHelper.assertTable(page, data1);
        const data2 = await SummaryHelper.getData('2019-12-01', '2019-12-31', 21);
        await GlobalHelper.setFilter(page, {
            start: '2019-12-01',
            end: '2019-12-31'
        });
        await SummaryHelper.assertTable(page, data2);
        const data3 = await SummaryHelper.getData('2019-11-01', '2019-11-30', 19, filteredSlackUsers);
        await GlobalHelper.setFilter(page, {
            start: '2019-11-01',
            end: '2019-11-30',
            slackUsers: filteredSlackUsers
        });
        await SummaryHelper.assertTable(page, data3);
        const data4 = await SummaryHelper.getData('2019-12-01', '2019-12-31', 21, null, true);
        await GlobalHelper.setFilter(page, {
            start: '2019-12-01',
            end: '2019-12-31',
            all: true
        });
        await SummaryHelper.assertTable(page, data4);
        await GlobalHelper.resetFilter(page);
        const currentStart = DayJS().startOf('month').format('YYYY-MM-DD');
        const currentEnd = DayJS().endOf('month').format('YYYY-MM-DD');
        await GlobalHelper.assertFilterValues(page, {
            start: currentStart,
            end: currentEnd
        });
        const data5 = await SummaryHelper.getData('2019-12-01', '2019-12-31', 21);
        await GlobalHelper.setFilter(page, {
            start: '2019-12-01',
            end: '2019-12-31'
        });
        await SummaryHelper.assertTable(page, data5);
    });

    test('Should save filter', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/summary'));
        for (const filter of [{
            start: '2019-11-01',
            end: '2019-11-30',
            slackUsers: ['John Marston', 'Sadie Adler'],
            all: false
        }, {
            start: '2019-12-01',
            end: '2019-12-31',
            slackUsers: ['Arthur Morgan', 'Sadie Adler'],
            all: true
        }]) {
            await GlobalHelper.clearSelects(page);
            await GlobalHelper.setFilter(page, filter);
            await GlobalHelper.visitPageThroughMenu(page, 'schedule');
            await GlobalHelper.visitPageThroughMenu(page, 'daysoff');
            await GlobalHelper.visitPageThroughMenu(page, 'summary');
            await GlobalHelper.assertFilterValues(page, filter);
        }
    });

    test('Should reset filters after logging out', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/summary'));
        const defaultFilter = {
            start: DayJS().startOf('month').format('YYYY-MM-DD'),
            end: DayJS().endOf('month').format('YYYY-MM-DD'),
            slackUser: [],
            all: false
        };
        const filter = {
            start: '2019-11-01',
            end: '2019-11-30',
            slackUsers: ['John Marston', 'Sadie Adler'],
            all: true
        };
        await GlobalHelper.clearSelects(page);
        await GlobalHelper.setFilter(page, filter);
        await GlobalHelper.logout(page);
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/summary'));
        await GlobalHelper.assertFilterValues(page, defaultFilter);
    });

    test('Should scroll and still see table header', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/summary'));
        await GlobalHelper.setFilter(page, {
            start: '2019-01-01',
            end: '2019-12-31',
            all: true
        });
        await SummaryHelper.assertFixedHeader(page);
    });
});
