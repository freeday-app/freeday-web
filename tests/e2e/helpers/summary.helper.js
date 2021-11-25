const DayJS = require('dayjs');

const GlobalHelper = require('./global.helper.js');
const DataHelper = require('./data.helper.js');
const Lang = require('./lang.helper.js');

const SummaryHelper = {

    // gets daysoff summary data
    async getData(start, end, workDays, slackUserNames = null, allUsers = false) {
        const dataPerSlackUser = {};
        const defaultData = {
            totalCount: 0,
            typeCount: {},
            rate: 1,
            workedDays: workDays,
            workDays
        };
        // gets daysoff / types / slack users
        const dayoffTypes = await DataHelper.getDayoffTypes(null, true);
        for (const type of dayoffTypes) {
            defaultData.typeCount[type.id] = 0;
        }
        const daysoff = await DataHelper.getDaysoff(start, end, slackUserNames);
        const slackUsers = await DataHelper.getSlackUsers();
        // aggregates data
        if (allUsers) {
            for (const slackUser of slackUsers) {
                dataPerSlackUser[slackUser.slackId] = {
                    ...JSON.parse(JSON.stringify(defaultData)),
                    slackUser
                };
            }
        }
        for (const dayoff of daysoff) {
            const slackUserId = dayoff.slackUser.slackId;
            if (!dataPerSlackUser[slackUserId]) {
                dataPerSlackUser[slackUserId] = {
                    ...JSON.parse(JSON.stringify(defaultData)),
                    slackUser: dayoff.slackUser
                };
            }
            // loops on days and increments values
            dayoff.days.forEach((date) => {
                const startUs = DayJS(dayoff.start).format('YYYY-MM-DD');
                const endUs = DayJS(dayoff.end).format('YYYY-MM-DD');
                const dateUs = DayJS(date).format('YYYY-MM-DD');
                if (dateUs >= start && dateUs <= end) {
                    let inc = 1;
                    if (
                        (dateUs === startUs && dayoff.startPeriod === 'pm')
                        || (dateUs === endUs && dayoff.endPeriod === 'am')
                    ) {
                        inc = 0.5;
                    }
                    dataPerSlackUser[slackUserId].totalCount += inc;
                    if (dataPerSlackUser[slackUserId].typeCount[dayoff.type.id] >= 0) {
                        dataPerSlackUser[slackUserId].typeCount[dayoff.type.id] += inc;
                    }
                    dataPerSlackUser[slackUserId].workedDays -= inc;
                }
            });
        }
        // calculates rates and sort by slack user name
        return Object.values(dataPerSlackUser).map((data) => ({
            ...data,
            rate: Math.round(
                (data.workedDays / data.workDays) * 100
            ) / 100
        })).sort((a, b) => {
            if (a.slackUser.name < b.slackUser.name) { return -1; }
            if (a.slackUser.name > b.slackUser.name) { return 1; }
            return 0;
        });
    },

    // checks elements of summary page
    async assertPage(page) {
        const dayoffTypes = await DataHelper.getDayoffTypes(null, true);
        await GlobalHelper.assertFilter(page, ['start', 'end', 'slackUsers', 'all']);
        await GlobalHelper.assertTooltip(
            page,
            '#summary .summary-bottom:has(a[download="freeday-csv-export.csv"] button.summary-button.bp3-intent-primary) .summary-csv-helper .bp3-icon[icon="help"]',
            Lang.text('summary.csvHelper')
        );
        await page.waitForSelector('#summary-main .summary-table');
        for (const thText of [
            ...dayoffTypes.map((dt) => ((dt.name.length > 16) ? `${dt.name.substring(0, dt.name.indexOf('$') + 1)}...` : dt.name)),
            Lang.text('summary.column.total'),
            Lang.text('summary.column.workedDays'),
            Lang.text('summary.column.workDays'),
            Lang.text('summary.column.rate')
        ]) {
            await page.waitForSelector(`#summary-main .summary-table thead tr th span.summary-column-text:has-text("${thText}")`);
        }
        await GlobalHelper.assertTooltip(
            page,
            `#summary-main .summary-table thead tr th:has(span.summary-column-text:has-text("${Lang.text('summary.column.rate')}")) .bp3-icon[icon="help"]`,
            Lang.text('summary.column.rateHelper')
        );
        for (let i = 0; i < dayoffTypes.length; i += 1) {
            await GlobalHelper.assertTooltip(
                page,
                `:nth-match(#summary-main .summary-table thead tr th, ${i + 2}) .dayoff-truncated-type`,
                dayoffTypes[i].name
            );
        }
    },

    // asserts scheduler content
    async assertTable(page, data) {
        const dayoffTypes = await DataHelper.getDayoffTypes(null, true);
        const typesByName = {};
        for (const type of dayoffTypes) {
            typesByName[type.name] = type;
        }
        const columns = [
            '', // User column has no title
            ...dayoffTypes.map((dt) => dt.name),
            Lang.text('summary.column.total'),
            Lang.text('summary.column.workedDays'),
            Lang.text('summary.column.workDays'),
            Lang.text('summary.column.rate')
        ];
        for (const d of data) {
            const tdsSelector = `tr:has(td.summary-table-name:has-text("${d.slackUser.name}")) td`;
            const ths = await page.$$('#summary-table thead th');
            for (let idx = 0; idx < ths.length; idx += 1) {
                let value;
                if (typesByName[columns[idx]]) {
                    value = d.typeCount[
                        typesByName[columns[idx]].id
                    ].toString();
                } else {
                    switch (columns[idx]) {
                        case Lang.text('summary.column.total'):
                            value = d.totalCount.toString();
                            break;
                        case Lang.text('summary.column.workedDays'):
                            value = d.workedDays.toString();
                            break;
                        case Lang.text('summary.column.workDays'):
                            value = d.workDays.toString();
                            break;
                        case Lang.text('summary.column.rate'):
                            value = d.rate.toString();
                            break;
                        default:
                            value = d.slackUser.name;
                            await page.waitForSelector(
                                `:nth-match(${tdsSelector}, ${idx + 1}) .avatar img[src="${d.slackUser.avatar}"]`
                            );
                    }
                }
                await page.waitForSelector(
                    `:nth-match(${tdsSelector}, ${idx + 1}):has-text("${value}")`
                );
            }
        }
    },

    // asserts that we still see summary table header even if we scroll to the bottom
    async assertFixedHeader(page) {
        await page.waitForSelector('#summary-table thead > tr');
        await page.$eval('#summary-main', (el) => {
            el.scrollTo(0, el.scrollHeight);
        });
        await page.waitForSelector('#summary-table thead > tr');
    }

};

module.exports = SummaryHelper;
