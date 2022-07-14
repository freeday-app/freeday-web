const { test } = require('@playwright/test');

const DataHelper = require('./helpers/data.helper');
const GlobalHelper = require('./helpers/global.helper');
const ConfigHelper = require('./helpers/config.helper');
const DaysoffHelper = require('./helpers/daysoff.helper');
const ScheduleHelper = require('./helpers/schedule.helper');
const SummaryHelper = require('./helpers/summary.helper');

test.describe('[Navigation header]', () => {
    test('Initializing tests', async ({ page }) => {
        await page.setDefaultTimeout(5000);
        await DataHelper.resetAuth();
        await DataHelper.resetData();
        await GlobalHelper.login(page);
        await GlobalHelper.changeLanguage(page, 'en');
    });

    test('Should highlight current page in header', async ({ page }) => {
        await DataHelper.setConfiguration({
            brandingName: null,
            brandingLogo: null
        });
        await GlobalHelper.login(page);
        await GlobalHelper.assertHeader(page, null, null);
        await page.goto(GlobalHelper.url('/daysoff'));
        await GlobalHelper.assertHeader(page, null, null);
        await DataHelper.setConfiguration();
        await GlobalHelper.logout(page);
        await GlobalHelper.login(page);
        await GlobalHelper.assertHeader(page);
        await page.goto(GlobalHelper.url('/daysoff'));
        await GlobalHelper.assertHeader(page);
        await GlobalHelper.assertSelectedNavButton(page, '/daysoff');
        await GlobalHelper.visitPageThroughMenu(page, 'daysoff');
        await GlobalHelper.assertSelectedNavButton(page, '/daysoff');
        await GlobalHelper.visitPageThroughMenu(page, 'schedule');
        await GlobalHelper.assertSelectedNavButton(page, '/schedule');
        await GlobalHelper.visitPageThroughMenu(page, 'summary');
        await GlobalHelper.assertSelectedNavButton(page, '/summary');
        await GlobalHelper.visitPageThroughMenu(page, 'types');
        await GlobalHelper.assertSelectedNavButton(page, '/config/types');
        await GlobalHelper.visitPageThroughMenu(page, 'admins');
        await GlobalHelper.assertSelectedNavButton(page, '/config/admins');
        await GlobalHelper.logout(page);
        await page.waitForSelector('#nav', { state: 'detached' });
        await GlobalHelper.login(page);
    });

    test('Should change client language', async ({ page }) => {
        await GlobalHelper.login(page);
        for (const lang of ['en', 'fr']) {
            await GlobalHelper.changeLanguage(page, lang);
            await GlobalHelper.assertHeader(page);
            await GlobalHelper.visitPageThroughMenu(page, 'daysoff');
            await GlobalHelper.setFilter(page, {
                start: '2019-12-01',
                end: '2019-12-31'
            });
            await DaysoffHelper.assertPage(page);
            await GlobalHelper.visitPageThroughMenu(page, 'schedule');
            await GlobalHelper.setFilter(page, {
                month: 11,
                year: 2019
            });
            await ScheduleHelper.assertPage(page, 30);
            await GlobalHelper.visitPageThroughMenu(page, 'summary');
            await GlobalHelper.setFilter(page, {
                start: '2019-11-01',
                end: '2019-11-30'
            });
            await SummaryHelper.assertPage(page);
            await GlobalHelper.visitPageThroughMenu(page, 'types');
            await ConfigHelper.assertPage(page, 'types');
            await GlobalHelper.visitPageThroughMenu(page, 'admins');
            await ConfigHelper.assertPage(page, 'admins');
        }
        await GlobalHelper.changeLanguage(page, 'en');
    });

    test('Should change client theme', async ({ page }) => {
        await GlobalHelper.login(page);
        for (const [theme, bodyClass] of [['light', 'bp4'], ['dark', 'bp4-dark']]) {
            await GlobalHelper.changeTheme(page, theme);
            await GlobalHelper.assertHeader(page);
            await page.$eval(
                'body',
                (el, className) => el.classList.contains(className),
                bodyClass
            );
        }
        await GlobalHelper.changeTheme(page, 'light');
    });

    test('Should open the support dialog', async ({ page }) => {
        await GlobalHelper.login(page);
        await GlobalHelper.assertSupportDialog(page);
    });
});
