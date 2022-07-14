const DayJS = require('dayjs');
const { test } = require('@playwright/test');

const DataHelper = require('./helpers/data.helper');
const GlobalHelper = require('./helpers/global.helper');
const ScheduleHelper = require('./helpers/schedule.helper');

test.describe('[Schedule]', () => {
    test('Initializing tests', async ({ page }) => {
        await page.setDefaultTimeout(5000);
        await DataHelper.resetAuth();
        await DataHelper.resetData();
        await DataHelper.takeActionOnAllDaysoff(['confirm', 'cancel', null]);
        await GlobalHelper.login(page);
        await GlobalHelper.changeLanguage(page, 'en');
        await GlobalHelper.assertFooter(page);
    });

    test('Should have everything in its right place', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/schedule'));
        await GlobalHelper.setFilter(page, {
            month: 11,
            year: 2019
        });
        await ScheduleHelper.assertPage(page, 30);
        await GlobalHelper.setFilter(page, {
            month: 12,
            year: 2019
        });
        await ScheduleHelper.assertPage(page, 31);
        await GlobalHelper.assertSelectedNavButton(page, '/schedule');
    });

    test('Should filter scheduler then reset filter', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/schedule'));
        const novemberDaysoff = await await DataHelper.getDaysoff('2019-11-01', '2019-11-30');
        const decemberDaysoff = await await DataHelper.getDaysoff('2019-12-01', '2019-12-31');
        await GlobalHelper.setFilter(page, {
            month: 11,
            year: 2019
        });
        await ScheduleHelper.assertScheduler(
            page,
            '2019-11-01',
            '2019-11-30',
            novemberDaysoff,
            true
        );
        await GlobalHelper.setFilter(page, {
            month: 12,
            year: 2019,
            all: true
        });
        await ScheduleHelper.assertScheduler(
            page,
            '2019-12-01',
            '2019-12-31',
            decemberDaysoff
        );
        await ScheduleHelper.assertEmptyRow(page, 'Abigail Marston');
        const slackUsers = ['Sadie Adler', 'Arthur Morgan'];
        await GlobalHelper.setFilter(page, {
            month: 12,
            year: 2019,
            slackUsers
        });
        await ScheduleHelper.assertScheduler(
            page,
            '2019-12-01',
            '2019-12-31',
            decemberDaysoff.filter((d) => slackUsers.includes(d.slackUser.name))
        );
        await GlobalHelper.resetFilter(page);
        const currentMonth = DayJS().format('M');
        const currentYear = DayJS().format('YYYY');
        await GlobalHelper.assertFilterValues(page, {
            month: currentMonth,
            year: currentYear
        });
        await GlobalHelper.setFilter(page, {
            month: 11,
            year: 2019
        });
        await ScheduleHelper.assertScheduler(
            page,
            '2019-11-01',
            '2019-11-30',
            novemberDaysoff
        );
    });

    test('Should save filter', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/schedule'));
        for (const filter of [{
            month: 11,
            year: 2019,
            slackUsers: ['John Marston'],
            all: false
        }, {
            month: 12,
            year: 2019,
            slackUsers: ['Arthur Morgan', 'Sadie Adler'],
            all: true
        }]) {
            await GlobalHelper.clearSelects(page);
            await GlobalHelper.setFilter(page, filter);
            await GlobalHelper.visitPageThroughMenu(page, 'daysoff');
            await GlobalHelper.visitPageThroughMenu(page, 'summary');
            await GlobalHelper.visitPageThroughMenu(page, 'schedule');
            await GlobalHelper.assertFilterValues(page, filter);
        }
    });

    test('Should reset filters after logging out', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/schedule'));
        const defaultFilter = {
            month: DayJS().month() + 1,
            year: DayJS().year(),
            slackUser: [],
            all: false
        };
        const filter = {
            month: 11,
            year: 2019,
            slackUsers: ['John Marston'],
            all: true
        };
        await GlobalHelper.clearSelects(page);
        await GlobalHelper.setFilter(page, filter);
        await GlobalHelper.logout(page);
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/schedule'));
        await GlobalHelper.assertFilterValues(page, defaultFilter);
    });

    test('Should perform actions on scheduler', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/schedule'));
        await GlobalHelper.setFilter(page, {
            month: 12,
            year: 2019
        });
        const decemberDaysoff = await DataHelper.getDaysoff('2019-12-01', '2019-12-31');
        for (const dayoff of decemberDaysoff.slice(0, 4)) {
            for (const action of ['cancel', 'confirm', 'reset']) {
                const eventSelector = await ScheduleHelper.getRandomEventSelector(
                    page,
                    '2019-12-01',
                    '2019-12-31',
                    dayoff
                );
                await ScheduleHelper.performAction(
                    page,
                    eventSelector,
                    dayoff,
                    action,
                    action === 'cancel' ? 'test' : null
                );
            }
        }
    });

    test('Should handle conflicts', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/schedule'));
        const daysoff = await DataHelper.getDaysoff('2019-11-01', '2019-11-30');
        const dayoff = await DataHelper.createDayoff({
            type: daysoff[0].type.id,
            slackUserId: daysoff[0].slackUser.slackId,
            start: DayJS(daysoff[0].start).format('YYYY-MM-DD'),
            end: DayJS(daysoff[0].end).format('YYYY-MM-DD')
        }, true);
        await GlobalHelper.setFilter(page, {
            month: 11,
            year: 2019
        });
        await ScheduleHelper.handleConflict(page, dayoff.id);
    });

    test('Should scroll and still see table header', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/schedule'));
        await GlobalHelper.setFilter(page, {
            month: 11,
            year: 2019,
            all: true
        });
        await ScheduleHelper.assertFixedHeader(page);
    });
});
