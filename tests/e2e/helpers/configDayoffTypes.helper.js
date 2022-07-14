const { expect } = require('chai');

const GlobalHelper = require('./global.helper');
const Lang = require('./lang.helper');

const ConfigDayoffTypesHelper = {

    // asserts dayoff type with given data
    assertData(dayoffType, expectedDayoffType) {
        expect(dayoffType).to.be.an('object');
        expect(dayoffType).to.have.property('id');
        expect(dayoffType).to.have.property('name');
        expect(dayoffType).to.have.property('enabled');
        expect(dayoffType).to.have.property('displayed');
        expect(dayoffType).to.have.property('important');
        expect(dayoffType.name).to.equal(expectedDayoffType.name);
        expect(dayoffType.enabled).to.equal(expectedDayoffType.enabled);
        expect(dayoffType.displayed).to.equal(expectedDayoffType.displayed);
        expect(dayoffType.important).to.equal(expectedDayoffType.important);
    },

    // asserts dayoff type form
    async assertForm(page, dayoffType = null) {
        const dt = dayoffType || {};
        if (dt.name) {
            await page.waitForSelector(`#config-main h3:has-text("${
                (dt.name.length > 50) ? `${dt.name.substring(0, dt.name.indexOf('@') + 1)}...` : `${Lang.text('dayoffType.edit')} ${dt.name}`
            }")`);
        } else {
            await page.waitForSelector(`#config-main h3:has-text("${Lang.text('dayoffType.new')}")`);
        }
        await page.waitForSelector('#config-main form.dayoffType-form');
        // checks name label and input
        const nameInputValue = await page.$eval(
            `.dayoffType-form .bp3-form-group:has(.bp3-label:has-text("${
                Lang.text('dayoffType.form.name')
            }")) .bp3-form-content .bp3-input-group:has(.bp3-icon-annotation) input.bp3-input`,
            (el) => el.value
        );
        expect(nameInputValue).to.equal(dt.name ? dt.name : '');
        // checks emoji picker
        const buttonSelector = `.dayoffType-form .bp3-form-group:has(.bp3-label:has-text("${
            Lang.text('dayoffType.form.emoji')
        }")) button.emoji-picker-button`;
        if (dt.emoji) {
            const emojiAriaLabel = await page.getAttribute(`${buttonSelector} span.emoji-mart-emoji`, 'aria-label');
            expect(emojiAriaLabel).to.contain(dt.emoji);
        } else {
            await page.waitForSelector(`${buttonSelector}:has-text("${Lang.text('emojiPicker.none')}")`);
        }
        // checks name label and input
        const switchValues = {
            enabled: Object.prototype.hasOwnProperty.call(dt, 'enabled') ? dt.enabled : null,
            displayed: Object.prototype.hasOwnProperty.call(dt, 'displayed') ? dt.displayed : null,
            important: Object.prototype.hasOwnProperty.call(dt, 'important') ? dt.important : null
        };
        for (const switchName of ['enabled', 'displayed', 'important']) {
            const labelText = Lang.text(`dayoffType.form.${switchName}`);
            await page.waitForSelector(
                `.dayoffType-form .bp3-form-group label.bp3-control:has-text("${
                    labelText
                }"):has(input[type="checkbox"]) .bp3-control-indicator`
            );
            const shouldBeChecked = switchValues[switchName] !== null
                ? switchValues[switchName]
                : ['enabled', 'displayed'].includes(switchName);
            const isChecked = await page.isChecked(
                `.dayoffType-form .bp3-form-group label.bp3-control:has-text("${
                    labelText
                }") input[type="checkbox"]`
            );
            if (shouldBeChecked) {
                expect(isChecked).to.be.true;
            } else {
                expect(isChecked).to.be.false;
            }
        }
        // checks buttons
        await page.waitForSelector(
            `.dayoffType-form button.bp3-intent-primary:has(.bp3-icon-${dayoffType ? 'floppy-disk' : 'add'}) .bp3-button-text:has-text("${
                Lang.text(`button.${dayoffType ? 'save' : 'create'}`)
            }")`
        );
        await page.waitForSelector(
            `.dayoffType-form button:has(.bp3-icon-undo) .bp3-button-text:has-text("${Lang.text('button.cancel')}")`
        );
    },

    // asserts dayoff type form button status (enabled / disabled)
    async assertFormButtons(page) {
        const nameSelector = '.dayoffType-form .bp3-input-group input[name="name"]';
        const assertEnabled = async () => {
            const enabled = await page.isEnabled('.dayoffType-form button.bp3-intent-primary');
            expect(enabled).to.be.true;
            await page.$eval('.dayoffType-form button.bp3-intent-primary', (el) => (
                !el.classList.contains('bp3-disabled')
            ));
        };
        const assertDisabled = async () => {
            const enabled = await page.isEnabled('.dayoffType-form button.bp3-intent-primary');
            expect(enabled).to.be.false;
            await page.$eval('.dayoffType-form button.bp3-intent-primary', (el) => (
                el.classList.contains('bp3-disabled')
            ));
        };
        await page.fill(nameSelector, '');
        await assertDisabled();
        await page.fill(nameSelector, 'a');
        await assertEnabled();
        await page.fill(nameSelector, '');
        await await assertDisabled();
        await page.fill(nameSelector, 'aaa');
        assertEnabled();
    },

    // asserts dayoff type form switch helpers
    async assertFormSwitches(page) {
        const dataList = [{
            name: 'enabled',
            checked: 'enabledHelp',
            unchecked: 'disabledHelp'
        }, {
            name: 'displayed',
            checked: 'displayedHelp',
            unchecked: 'notDisplayedHelp'
        }, {
            name: 'important',
            checked: 'importantHelp',
            unchecked: 'notImportantHelp'
        }];
        for (const data of dataList) {
            const labelText = Lang.text(`dayoffType.form.${data.name}`);
            const isChecked = await page.isChecked(
                `.dayoffType-form .bp3-form-group label.bp3-control:has-text("${labelText}") input[type="checkbox"]`
            );
            if (!isChecked) {
                await page.click(
                    `.dayoffType-form .bp3-form-group:has(label.bp3-control:has-text("${labelText}")) .bp3-switch`
                );
            }
            await page.waitForSelector(
                `.dayoffType-form .bp3-form-group:has(label.bp3-control:has-text("${
                    labelText
                }")) .bp3-form-helper-text:has-text("${
                    Lang.text(`dayoffType.form.${data.checked}`)
                }")`
            );
            await page.click(
                `.dayoffType-form .bp3-form-group:has(label.bp3-control:has-text("${labelText}")) .bp3-switch`
            );
            await page.waitForSelector(
                `.dayoffType-form .bp3-form-group:has(label.bp3-control:has-text("${
                    labelText
                }")) .bp3-form-helper-text:has-text("${
                    Lang.text(`dayoffType.form.${data.unchecked}`)
                }")`
            );
        }
    },

    // fills and submits dayoff type form
    async fillAndSubmitForm(
        page,
        dayoffType = null,
        isCreate = false,
        assertToaster = true,
        waitListRoute = true
    ) {
        const dt = dayoffType || null;
        const inputNameSelector = '.dayoffType-form .bp3-input-group input[name="name"]';
        if (dt.name) {
            await page.fill(inputNameSelector, dt.name);
        } else {
            await page.fill(inputNameSelector, '');
        }
        const switchValues = {
            enabled: Object.prototype.hasOwnProperty.call(dt, 'enabled') ? dt.enabled : null,
            displayed: Object.prototype.hasOwnProperty.call(dt, 'displayed') ? dt.displayed : null,
            important: Object.prototype.hasOwnProperty.call(dt, 'important') ? dt.important : null
        };
        for (const switchName of ['enabled', 'displayed', 'important']) {
            const labelText = Lang.text(`dayoffType.form.${switchName}`);
            const isChecked = await page.isChecked(
                `.dayoffType-form .bp3-form-group label.bp3-control:has-text("${labelText}") input[type="checkbox"]`
            );
            if (isChecked !== switchValues[switchName]) {
                await page.click(
                    `.dayoffType-form .bp3-form-group:has(label.bp3-control:has-text("${labelText}")) .bp3-switch`
                );
            }
        }
        // checks emoji picker
        await GlobalHelper.pickEmoji(
            page,
            `.dayoffType-form .bp3-form-group:has(.bp3-label:has-text("${
                Lang.text('dayoffType.form.emoji')
            }")) button.emoji-picker-button`,
            dt.emoji
        );
        const tasks = [
            page.click('.dayoffType-form button.bp3-intent-primary'),
            GlobalHelper.waitAPI(page, isCreate ? 'createDayoffType' : 'editDayoffType')
        ];
        if (waitListRoute) {
            tasks.push(
                GlobalHelper.waitAPI(page, 'getDayoffTypes')
            );
        }
        await Promise.all(tasks);
        if (assertToaster) {
            await GlobalHelper.assertToaster(page, 'success', Lang.text(`dayoffType.success.${isCreate ? 'create' : 'edit'}`));
        }
    },

    async dayoffTypeName(page, name = '') {
        const inputNameSelector = '.dayoffType-form .bp3-input-group input[name="name"]';
        await page.fill(inputNameSelector, name);
    },

    async assertDayoffTypeNameValue(page, value = null) {
        const inputNameSelector = '.dayoffType-form .bp3-input-group input[name="name"]';
        const inputValue = await page.$eval(inputNameSelector, (el) => el.value);
        expect(inputValue).to.equal(value);
    }

};

module.exports = ConfigDayoffTypesHelper;
