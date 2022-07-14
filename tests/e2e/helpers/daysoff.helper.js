const { expect } = require('chai');
const DayJS = require('dayjs');

const GlobalHelper = require('./global.helper');
const Lang = require('./lang.helper');

const DaysoffHelper = {

    // checks elements of daysoff page
    async assertPage(page) {
        await page.waitForSelector(`.dayoff-buttons button:has-text("${Lang.text('dayoff.button.create')}")`);
        await page.waitForSelector(`.dayoff-buttons button:has-text("${Lang.text('button.csv')}")`);
        await GlobalHelper.assertFilter(page, ['start', 'end', 'slackUsers', 'type', 'status']);
        await page.waitForSelector('#dayoff-table');
        for (const name of [
            Lang.text('dayoff.field.user'),
            Lang.text('dayoff.field.type'),
            Lang.text('dayoff.field.start'),
            Lang.text('dayoff.field.end'),
            Lang.text('dayoff.field.count'),
            Lang.text('dayoff.field.comment'),
            Lang.text('dayoff.field.important'),
            Lang.text('dayoff.field.status'),
            Lang.text('dayoff.field.actions'),
            Lang.text('dayoff.field.user')
        ]) {
            await page.waitForSelector(`#dayoff-table thead th:has-text("${name}")`);
        }
        await page.waitForSelector('.bp3-popover', { state: 'detached' });
        await page.click('#dayoff-table td.dayoff-action .bp3-popover-target');
        await page.waitForSelector('.bp3-popover');
        for (const name of [
            Lang.text('button.confirm'),
            Lang.text('button.cancel'),
            Lang.text('button.reset'),
            Lang.text('button.edit')
        ]) {
            await page.waitForSelector(`.bp3-popover ul.bp3-menu li a.bp3-menu-item:has-text("${name}")`);
        }
        await GlobalHelper.blankClick(page);
        await page.waitForSelector('.bp3-popover', { state: 'detached' });
    },

    // checks dayoff list content with given dayoff data
    // this will also check that the list is correctly sorted
    async assertList(page, daysoff, status = null, testTooltip = false) {
        await page.$eval(
            '#dayoff-table tbody tr',
            (el, length) => el.length === length,
            daysoff.length
        );
        for (const dayoff of daysoff) {
            const cellSelector = (field) => (
                `#dayoff-table tbody tr[data-dayoffid="${dayoff.id}"] td.dayoff-${field}`
            );
            // avatar and name
            await page.waitForSelector(
                `${cellSelector('name')}:has-text("${
                    dayoff.slackUser.name
                }") .avatar img[src="${
                    dayoff.slackUser.avatar
                }"]`
            );
            // type
            if (dayoff.type.emoji) {
                await page.waitForSelector(
                    `${cellSelector('type')} span.emoji-mart-emoji[aria-label*="${dayoff.type.emoji}"]`
                );
            }
            if (dayoff.type.name.length > 16) {
                await page.waitForSelector(
                    `${cellSelector('type')}:has-text("${dayoff.type.name.substring(0, dayoff.type.name.indexOf('$') + 1)}...")`
                );
                if (testTooltip) {
                    await page.waitForSelector(
                        `${cellSelector('type')} .dayoff-truncated-type`
                    );
                    await GlobalHelper.assertTooltip(
                        page,
                        `${cellSelector('type')} .dayoff-truncated-type`,
                        dayoff.type.name
                    );
                }
            } else {
                await page.waitForSelector(
                    `${cellSelector('type')}:has-text("${dayoff.type.name}")`
                );
            }
            // dates
            for (const startOrEnd of ['start', 'end']) {
                const date = dayoff[startOrEnd];
                const period = dayoff[`${startOrEnd}Period`];
                const dateString = DayJS(date).format(Lang.text('date.format', false));
                const periodString = period !== null ? Lang.text(`period.short.${period}`) : '';
                const datePeriodString = Lang.ucfirst(`${dateString} ${periodString}`.toLowerCase());
                const dateFullString = DayJS(date).format(Lang.text('date.formatFull', false));
                const periodFullString = period !== null ? Lang.text(`period.${period}`) : '';
                const datePeriodFullString = Lang.ucfirst(`${dateFullString} ${periodFullString}`.toLowerCase());
                await page.waitForSelector(
                    `${cellSelector(startOrEnd)}:has-text("${datePeriodString}")`
                );
                if (testTooltip) {
                    await GlobalHelper.assertTooltip(
                        page,
                        `${cellSelector(startOrEnd)} .dayoff-date`,
                        datePeriodFullString
                    );
                }
            }
            // count
            await page.waitForSelector(
                `${cellSelector('count')}:has-text("${dayoff.count.toString()}")`
            );
            // comment
            if (dayoff.comment) {
                if (dayoff.comment.length > 50) {
                    await page.waitForSelector(
                        `${cellSelector('comment')}:has-text("${dayoff.comment.substring(0, dayoff.comment.indexOf('@') + 1)}...")`
                    );
                    if (testTooltip) {
                        await GlobalHelper.assertTooltip(
                            page,
                            `${cellSelector('comment')} .dayoff-truncated-comment`,
                            dayoff.comment
                        );
                    }
                } else {
                    await page.waitForSelector(
                        `${cellSelector('comment')}:has-text("${dayoff.comment}")`
                    );
                    if (testTooltip) {
                        await GlobalHelper.assertTooltip(
                            page,
                            `${cellSelector('comment')}`,
                            dayoff.comment
                        );
                    }
                }
            } else {
                await page.waitForSelector(`${cellSelector('comment')}:has-text("")`);
            }
            // important
            if (dayoff.type.important) {
                await page.waitForSelector(
                    `${cellSelector('important')} span.emoji-mart-emoji[aria-label*="warning"]`
                );
            }
            // status
            if (status) {
                await page.waitForSelector(
                    `${cellSelector('status')} p:has-text("${status}")`
                );
            } else {
                const statusText = await page.textContent(
                    `${cellSelector('status')} p`
                );
                expect(statusText).to.be.oneOf([
                    Lang.text('dayoff.status.pending'),
                    Lang.text('dayoff.status.confirmed'),
                    Lang.text('dayoff.status.canceled')
                ]);
            }
            // action
            const actions = await page.$$(
                `${cellSelector('action')} svg[data-icon="cog"]`
            );
            expect(actions).to.have.lengthOf(1);
        }
    },

    // changes dayoff status and assert status in dayoff list
    async changeAndAssertStatus(page, rowIdx, action, status, cancelReason = null) {
        const isCancel = action === Lang.text('button.cancel');
        await page.click(`:nth-match(#dayoff-table td.dayoff-action .bp3-popover-target, ${rowIdx + 1})`);
        const tasks = [
            page.click(`.bp3-popover ul.bp3-menu li a.bp3-menu-item:has-text("${action}")`)
        ];
        if (!isCancel) {
            tasks.push(GlobalHelper.waitAPI(page, 'actionDayoff'));
        }
        await Promise.all(tasks);
        await page.waitForSelector(`.bp3-popover ul.bp3-menu li a.bp3-menu-item:has-text("${action}")`, {
            state: 'detached'
        });
        if (isCancel) {
            await page.fill('.bp3-dialog .bp3-input', cancelReason);
            await Promise.all([
                page.click(`.bp3-dialog .bp3-intent-primary:has-text("${Lang.text('button.confirm')}")`),
                GlobalHelper.waitAPI(page, 'actionDayoff')
            ]);
        }
        await page.waitForSelector(`:nth-match(#dayoff-table tbody tr, ${rowIdx + 1}) td.dayoff-status p:has-text("${status}")`);
        if (isCancel) {
            await GlobalHelper.assertTooltip(
                page,
                `:nth-match(#dayoff-table tbody tr, ${rowIdx + 1}) td.dayoff-status div`,
                cancelReason
            );
        }
    },

    // tries to confirm target conflicted dayoff then handles conflict dialog
    async handleConflict(page, targetDayoffId) {
        const selector = `#dayoff-table tr[data-dayoffid="${targetDayoffId}"] td.dayoff-action .bp3-popover-target`;
        await GlobalHelper.assertConflict(page, selector);
        await GlobalHelper.handleConflict(page, selector, 'daysoff', true);
    },

    // checks that dayoff form elements exist
    async assertForm(page, isEdit = false) {
        await page.waitForSelector('.bp3-dialog');
        await page.waitForSelector(
            `.bp3-dialog .bp3-heading:has-text("${
                isEdit ? Lang.text('dayoff.dialog.form.editTitle') : Lang.text('dayoff.dialog.form.title')
            }")`
        );
        for (const label of [
            Lang.text('dayoff.field.slackUser'),
            Lang.text('dayoff.field.type')
        ]) {
            await page.waitForSelector(
                `.bp3-dialog .bp3-form-group:has(.bp3-label:has-text("${label}")) .react-select__control`
            );
        }
        for (const type of [
            Lang.text('filter.start'),
            Lang.text('filter.end')
        ]) {
            await page.waitForSelector(
                `.bp3-dialog .bp3-form-group:has(.bp3-label:has-text("${type}")) .bp3-input`
            );
            await page.waitForSelector(
                `.bp3-dialog .dayoff-form-body-row:has(.bp3-label:has-text("${Lang.text('period.am')}")) .bp3-switch`
            );
            await page.waitForSelector(
                `.bp3-dialog .dayoff-form-body-row:has(.bp3-label:has-text("${Lang.text('period.pm')}")) .bp3-switch`
            );
        }
        await page.waitForSelector(
            `.bp3-dialog .bp3-form-group:has(.bp3-label:has-text("${
                Lang.text('dayoff.field.comment')
            }")) .bp3-input`
        );
        await page.waitForSelector(
            `.bp3-dialog .bp3-button-text:has-text("${Lang.text('button.cancel')}")`
        );
        await page.waitForSelector(
            `.bp3-dialog .bp3-button-text:has-text("${Lang.text('button.confirm')}")`
        );
    },

    // fills dayoff form with given data
    async assertFormValues(page, dayoff) {
        await GlobalHelper.assertSingleValue(
            page,
            `.bp3-dialog .bp3-form-group:has(.bp3-label:has-text("${
                Lang.text('dayoff.field.slackUser')
            }")) .react-select__control`,
            dayoff.slackUser.name
        );
        await GlobalHelper.assertSingleValue(
            page,
            `.bp3-dialog .bp3-form-group:has(.bp3-label:has-text("${
                Lang.text('dayoff.field.type')
            }")) .react-select__control`,
            dayoff.type.name
        );
        for (const type of ['start', 'end']) {
            await page.waitForSelector(
                `.bp3-dialog .bp3-form-group:has(.bp3-label:has-text("${
                    Lang.text(`dayoff.field.${type}`)
                }")) .bp3-input[value="${DayJS(dayoff[type.toLowerCase()]).format(Lang.text('date.format'))}"]`
            );
            for (const period of ['am', 'pm']) {
                const isChecked = await page.isChecked(
                    `.bp3-dialog .dayoff-form-body-row:has(.bp3-label:has-text("${
                        Lang.text(`dayoff.field.${type}`)
                    }")) .bp3-form-group:has(.bp3-label:has-text("${
                        Lang.text(`period.${period}`)
                    }")) .bp3-switch input[type="checkbox"]`
                );
                expect(isChecked).to.equal(dayoff[`${type.toLowerCase()}Period`] === period);
            }
        }
        await page.waitForSelector(
            `.bp3-dialog .bp3-form-group:has(.bp3-label:has-text("${
                Lang.text('dayoff.field.comment')
            }")) .bp3-input[value="${dayoff.comment}"]`
        );
    },

    // fills dayoff form with given data
    async fillForm(page, dayoff, isEdit = false, submitForm = false) {
        if (!isEdit) {
            await GlobalHelper.selectValues(
                page,
                `.bp3-dialog .bp3-form-group:has(.bp3-label:has-text("${
                    Lang.text('dayoff.field.slackUser')
                }")) .react-select__control`,
                dayoff.slackUser.name,
                null,
                true
            );
        }
        await GlobalHelper.selectValues(
            page,
            `.bp3-dialog .bp3-form-group:has(.bp3-label:has-text("${
                Lang.text('dayoff.field.type')
            }")) .react-select__control`,
            dayoff.type.name || dayoff.type,
            null,
            true
        );
        for (const type of ['start', 'end']) {
            await page.fill(
                `.bp3-dialog .bp3-form-group:has(.bp3-label:has-text("${Lang.text(`dayoff.field.${type}`)}")) .bp3-input`,
                DayJS(dayoff[type.toLowerCase()]).format(Lang.text('date.format'))
            );
            await page.click(
                `.bp3-dialog .dayoff-form-body-row:has(.bp3-label:has-text("${
                    Lang.text(`dayoff.field.${type}`)
                }")) .bp3-form-group:has(.bp3-label:has-text("${
                    dayoff[`${type.toLowerCase()}Period`] === 'am'
                        ? Lang.text('period.am')
                        : Lang.text('period.pm')
                }")) .bp3-switch`
            );
        }
        await page.fill(
            `.bp3-dialog .bp3-form-group:has(.bp3-label:has-text("${
                Lang.text('dayoff.field.comment')
            }")) .bp3-input`,
            dayoff.comment
        );
        if (submitForm) {
            await Promise.all([
                page.click(`.bp3-dialog .bp3-button-text:has-text("${Lang.text('button.confirm')}")`),
                GlobalHelper.waitAPI(page, 'getDaysoff')
            ]);
        }
    },

    // clicks create dayoff button
    async create(page) {
        await page.click(`.dayoff-buttons button:has-text("${Lang.text('dayoff.button.create')}")`);
        await page.waitForSelector('.bp3-dialog');
    },

    // clicks csv export button
    async csvExport(page) {
        await page.click(`.dayoff-buttons button:has-text("${Lang.text('button.csv')}")`);
    },

    // checks errors are displayed in dayoff form
    async assertFormErrors(page) {
        for (const label of [
            Lang.text('dayoff.field.slackUser'),
            Lang.text('dayoff.field.type')
        ]) {
            await page.waitForSelector(
                `.bp3-dialog .bp3-form-group:has(.bp3-label:has-text("${label}")) .error .react-select__control`
            );
        }
        await page.waitForSelector(
            `.bp3-dialog .bp3-form-group:has(.bp3-label:has-text("${
                Lang.text('dayoff.field.start')
            }")) .error .bp3-input`
        );
    },

    // open first dayoff row menu, then clicks edit, then clicks dialog button if provided
    async editFirstRow(page, dialogButtonText) {
        await page.click('#dayoff-table td.dayoff-action .bp3-popover-target');
        await page.click(`.bp3-popover ul.bp3-menu li a.bp3-menu-item:has-text("${Lang.text('button.edit')}")`);
        await page.waitForSelector('.bp3-dialog');
        if (dialogButtonText) {
            await page.click(`.bp3-button-text:has-text("${dialogButtonText}")`);
        }
    },

    // asserts that we still see dayoff table header even if we scroll to the bottom page
    async assertFixedHeader(page) {
        await page.waitForSelector('thead > tr');
        await page.$eval('#dayoff-main', (el) => {
            el.scrollTo(0, el.scrollHeight);
        });
        await page.waitForSelector('thead > tr');
    }

};

module.exports = DaysoffHelper;
