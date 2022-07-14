const { expect } = require('chai');
const DayJS = require('dayjs');

const GlobalHelper = require('./global.helper');
const Lang = require('./lang.helper');

// gets list of day numbers (1-31) between to dates and within a range
const getDayNumbers = (startDate, endDate, rangeStart, rangeEnd) => {
    const dayNums = [];
    const fStart = DayJS(rangeStart).startOf('day');
    const fEnd = DayJS(rangeEnd).startOf('day');
    let start = DayJS(startDate).startOf('day');
    const end = DayJS(endDate).startOf('day');
    while (start.diff(end) <= 0) {
        if (start.diff(fStart) >= 0 && start.diff(fEnd) <= 0) {
            dayNums.push(start.date());
        }
        start = start.add(1, 'days');
    }
    return dayNums;
};

const getDaysoffByUserByPeriod = (daysoff, start, end) => {
    const dayList = getDayNumbers(start, end, start, end);
    const dayListObj = {};
    daysoff.forEach((dayoff) => {
        const userid = dayoff.slackUser.slackId;
        const startDate = DayJS(dayoff.start);
        const endDate = DayJS(dayoff.end);
        for (const day of dayoff.days) {
            const dayNum = DayJS(day).date();
            // initialize object for that user and day if needed
            if (!dayListObj[userid]) {
                dayListObj[userid] = {};
                dayList.forEach((d) => {
                    dayListObj[userid][d] = {};
                });
            }
            // determine what part of the day that specific event occupies
            const periods = [];
            if (dayNum === startDate.date()) {
                if (dayoff.startPeriod === 'pm') {
                    periods.push('pm');
                } else if (dayoff.startPeriod === 'am' && dayoff.count < 1) {
                    periods.push('am');
                } else {
                    periods.push('am');
                    periods.push('pm');
                }
            } else if (dayNum === endDate.date()) {
                if (dayoff.endPeriod === 'am') {
                    periods.push('am');
                } else if (dayoff.startPeriod === 'pm' && dayoff.count < 1) {
                    periods.push('pm');
                } else {
                    periods.push('am');
                    periods.push('pm');
                }
            } else {
                periods.push('am');
                periods.push('pm');
            }
            // register an event for a part of the day
            // non canceled daysoff have priority over canceled daysoff
            for (const period of periods) {
                if (
                    !dayListObj[userid][dayNum][period]
                    || dayListObj[userid][dayNum][period].canceled
                ) {
                    dayListObj[userid][dayNum][period] = dayoff;
                }
            }
        }
    });
    return dayListObj;
};

const parseUsers = (daysoff) => {
    const users = {};
    for (const dayoff of daysoff) {
        if (!users[dayoff.slackUser.slackId]) {
            users[dayoff.slackUser.slackId] = dayoff.slackUser;
        }
    }
    return users;
};

// returns event element color class based on dayoff status
const getEventColorClass = (dayoff) => {
    if (dayoff.confirmed) {
        return 'scheduler-table-green';
    }
    if (dayoff.canceled) {
        return 'scheduler-table-red';
    }
    return 'scheduler-table-grey';
};

// returns event element tooltip text based on dayoff status
const getEventTooltipText = (dayoff) => {
    const statusTexts = {
        confirmed: Lang.text('dayoff.status.confirmed'),
        pending: Lang.text('dayoff.status.pending'),
        canceled: Lang.text('dayoff.status.canceled')
    };
    let statusName = 'pending';
    if (dayoff.confirmed) {
        statusName = 'confirmed';
    } else if (dayoff.canceled) {
        statusName = 'canceled';
    }
    return dayoff.type.name + statusTexts[statusName];
};

const ScheduleHelper = {

    // checks elements of schedule page
    async assertPage(page, nbDays = 31) {
        await GlobalHelper.assertFilter(page, ['month', 'year', 'slackUsers', 'all']);
        await page.waitForSelector('#schedule-main .scheduler .scheduler-table');
        const daysElements = await page.$$('.scheduler-table-head-days .scheduler-table-head-day');
        expect(daysElements).to.have.lengthOf(nbDays);
    },

    // asserts scheduler content
    async assertScheduler(page, filterStart, filterEnd, daysoff, assertTooltips = false) {
        const daysoffByUser = getDaysoffByUserByPeriod(daysoff, filterStart, filterEnd);
        const users = parseUsers(daysoff);
        for (const userId of Object.keys(daysoffByUser)) {
            await page.waitForSelector(
                `.scheduler-table-body-ressource:has-text("${users[userId].name}")`
            );
            await page.waitForSelector(
                `.scheduler-table-body-ressource:has-text("${users[userId].name}") .avatar img[src="${users[userId].avatar}"]`
            );
            for (const dayNum of Object.keys(daysoffByUser[userId])) {
                const dayCellSelector = `:nth-match(tr:has(.scheduler-table-body-ressource:has-text("${
                    users[userId].name
                }")) .scheduler-table-body-day, ${dayNum})`;
                const dayCellClassList = await page.$eval(dayCellSelector, (el) => el.classList);
                if (!Object.values(dayCellClassList).includes('scheduler-table-holiday')) {
                    const dayEvents = daysoffByUser[userId][dayNum];
                    const periods = Object.keys(dayEvents);
                    if (periods.length === 2 && dayEvents.am.id === dayEvents.pm.id) {
                        // if that day has a single full dayoff
                        const dayoff = dayEvents.am;
                        await page.waitForSelector(
                            `${dayCellSelector} .scheduler-table-body-event[class*="${getEventColorClass(dayoff)}"]`
                        );
                        if (assertTooltips) {
                            await GlobalHelper.assertTooltip(
                                page,
                                `${dayCellSelector} .scheduler-table-body-event`,
                                getEventTooltipText(dayoff),
                                dayoff.type.emoji || null
                            );
                        }
                    } else if (periods.length > 0) {
                        // if that day has different daysoff on AM and PM
                        for (const period of periods) {
                            const dayoff = dayEvents[period];
                            await page.waitForSelector(
                                `${dayCellSelector} .scheduler-table-body-half-event.${period}[class*="${getEventColorClass(dayoff)}"]`
                            );
                            if (assertTooltips) {
                                await GlobalHelper.assertTooltip(
                                    page,
                                    `${dayCellSelector} .scheduler-table-body-half-event.${period}`,
                                    getEventTooltipText(dayoff),
                                    dayoff.type.emoji || null
                                );
                            }
                        }
                    }
                } else {
                    // no dayoff on that day
                    await page.waitForSelector(`${dayCellSelector} .scheduler-table-body-event`, {
                        state: 'detached'
                    });
                    await page.waitForSelector(`${dayCellSelector} .scheduler-table-body-half-event`, {
                        state: 'detached'
                    });
                }
            }
        }
    },

    // checks that a scheduler row contains no event
    async assertEmptyRow(page, slackUserName) {
        await page.waitForSelector(
            `.scheduler-table-body-ressource:has-text("${slackUserName}")`
        );
        await page.waitForSelector(
            `.scheduler-table-body-ressource:has-text("${slackUserName}") .scheduler-table-body-event`,
            { state: 'detached' }
        );
    },

    // gets a random element from event elements matching a dayoff
    async getRandomEventSelector(page, filterStart, filterEnd, dayoff) {
        const dayNumbers = getDayNumbers(
            filterStart,
            filterEnd,
            dayoff.start,
            dayoff.end
        );
        const eventsElements = [];
        for (const dayNum of dayNumbers) {
            const dayCellSelector = `:nth-match(tr:has(.scheduler-table-body-ressource:has-text("${
                dayoff.slackUser.name
            }")) .scheduler-table-body-day, ${dayNum})`;

            const dayCellClassList = await page.$eval(dayCellSelector, (el) => el.classList);
            if (!Object.values(dayCellClassList).includes('scheduler-table-holiday')) {
                eventsElements.push(
                    `${dayCellSelector} .clickable[data-dayoffid="${dayoff.id}"]`
                );
            }
        }
        return eventsElements[
            Math.floor(Math.random() * eventsElements.length)
        ];
    },

    // performs action on scheduler dayoff event
    // is chained on an .scheduler-table-body-event element
    async performAction(page, selector, dayoff, action, cancelReason = null) {
        const isConfirm = action === 'confirm';
        const isCancel = action === 'cancel';
        const expectedDayoff = {
            ...dayoff,
            confirmed: isConfirm,
            canceled: isCancel
        };
        await page.click(selector);
        await GlobalHelper.blankHover(page);
        await page.click(`.bp3-popover ul.bp3-menu li a.bp3-menu-item:has-text("${Lang.text(`button.${action}`)}")`);
        if (isCancel) {
            await page.fill('.bp3-dialog .bp3-input', cancelReason);
            await page.click(`.bp3-dialog .bp3-intent-primary:has-text("${Lang.text('button.confirm')}")`);
        }
        await GlobalHelper.assertTooltip(
            page,
            `${selector}[class*="${getEventColorClass(expectedDayoff)}"]`,
            getEventTooltipText(expectedDayoff),
            expectedDayoff.type.emoji || null
        );
    },

    // tries to confirm target conflicted dayoff then handles conflict dialog
    async handleConflict(page, targetDayoffId) {
        const selector = `.clickable[data-dayoffid="${targetDayoffId}"]`;
        await GlobalHelper.assertConflict(page, selector);
        await GlobalHelper.handleConflict(page, selector, 'schedule');
    },

    // asserts that we still see scheduler header even if we scroll to the bottom
    async assertFixedHeader(page) {
        await page.waitForSelector('.scheduler-table thead.scheduler-table-head-fixed > tr.scheduler-table-head-months');
        await page.$eval('#schedule-main', (el) => {
            el.scrollTo(0, el.scrollHeight);
        });
        await page.waitForSelector('.scheduler-table thead.scheduler-table-head-fixed > tr.scheduler-table-head-days');
    }

};

module.exports = ScheduleHelper;
