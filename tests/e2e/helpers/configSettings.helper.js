const { expect } = require('chai');
const Path = require('path');

const DataHelper = require('./data.helper.js');
const GlobalHelper = require('./global.helper.js');
const Lang = require('./lang.helper.js');

const ConfigSettingsHelper = {

    // asserts general settings form
    async assertForm(
        page,
        brandingName = null,
        brandingLogoFileName = null,
        isbrandingLogo = false,
        slackReferrerName = null,
        monthlyRecap = false
    ) {
        const slackChannels = await DataHelper.getSlackChannels();
        // checks brandingName label and input
        const brandingInputSelector = `.settings-form .bp3-form-group:has(.bp3-label:has-text("${
            Lang.text('settings.form.brandingName')
        }")) .bp3-form-content .bp3-input-group:has(.bp3-icon-annotation) input.bp3-input`;
        await page.waitForSelector(brandingInputSelector);
        const brandingInputValue = await page.$eval(brandingInputSelector, (el) => el.value);
        expect(brandingInputValue).to.equal(brandingName || '');
        // checks brandingLogo label and input
        await page.waitForSelector(
            `.settings-form .bp3-form-group:has(.bp3-label:has-text("${
                Lang.text('settings.form.brandingLogo')
            }")) .bp3-form-content .bp3-file-input .bp3-file-upload-input:has-text("${
                brandingLogoFileName || '...'
            }")`
        );
        if (isbrandingLogo) {
            await page.waitForSelector(
                '.settings-form .settings-brandingLogo-container img.settings-brandingLogo-image[src^="data:image/png;base64,"]'
            );
            await page.waitForSelector(
                '.settings-form .settings-brandingLogo-container .bp3-icon-trash.settings-brandingLogo-icon'
            );
        } else {
            await page.waitForSelector('.settings-form .settings-brandingLogo-container', {
                state: 'detached'
            });
        }
        // checks slack referrer label and select
        await GlobalHelper.assertOptions(
            page,
            `.settings-form .bp3-form-group:has(.bp3-label:has-text("${
                Lang.text('settings.form.slackReferrer')
            }")) .react-select__control`,
            slackChannels.map((c) => c.name)
        );
        await GlobalHelper.assertTooltip(
            page,
            `.settings-form .bp3-form-group:has(.bp3-label:has-text("${
                Lang.text('settings.form.slackReferrer')
            }")) .summary-csv-helper .bp3-icon[icon="help"]`,
            Lang.text('settings.form.slackReferrerHelper')
        );
        if (slackReferrerName) {
            await page.waitForSelector(
                `.settings-form .bp3-form-group:has(.bp3-label:has-text("${
                    Lang.text('settings.form.slackReferrer')
                }")) .react-select__control .react-select__single-value:has-text("${
                    slackReferrerName
                }")`
            );
        } else {
            await page.waitForSelector(
                `.settings-form .bp3-form-group:has(.bp3-label:has-text("${
                    Lang.text('settings.form.slackReferrer')
                }")) .react-select__control .react-select__single-value`,
                { state: 'detached' }
            );
        }
        // checks monthly recap job
        await page.waitForSelector(
            `.settings-form .bp3-form-group .bp3-switch:has-text("${
                Lang.text('settings.form.monthlyRecap')
            }")`
        );
        await GlobalHelper.assertTooltip(
            page,
            '.settings-form .settings-monthlyRecap-container .summary-csv-helper .bp3-icon',
            Lang.text('settings.form.monthlyRecapHelper')
        );
        const isChecked = await page.isChecked(
            '.settings-form .bp3-form-group .setting-monthlyRecap-switch input[type="checkbox"]'
        );
        if (monthlyRecap) {
            expect(isChecked).to.be.true;
        } else {
            expect(isChecked).to.be.false;
        }
        // checks button
        await page.waitForSelector(
            `.settings-form button.bp3-intent-primary:has(.bp3-icon-floppy-disk) .bp3-button-text:has-text("${
                Lang.text('button.save')
            }")`
        );
    },

    // Tests that a warning is displayed when the current slack referrer is invalid
    async assertReferrerWarning(page) {
        await page.waitForSelector(
            `.settings-slackReferrer-error:has-text("${
                Lang.text('settings.error.currentReferrer')
            }")`
        );
    },

    // fills general settings form
    async fillForm(
        page,
        brandingName = null,
        brandingLogoFileName = null,
        slackReferrerName = false,
        monthlyRecap = false,
        submitForm = false
    ) {
        // set brandingName
        await page.fill(
            `.settings-form .bp3-form-group:has(.bp3-label:has-text("${
                Lang.text('settings.form.brandingName')
            }")) input.bp3-input`,
            brandingName || ''
        );
        // set brandingLogo
        if (brandingLogoFileName) {
            await page.setInputFiles(
                `.settings-form .bp3-form-group:has(.bp3-label:has-text("${
                    Lang.text('settings.form.brandingLogo')
                }")) .bp3-form-content .bp3-file-input input[type="file"]`,
                Path.join(__dirname, `../data/images/${brandingLogoFileName}`)
            );
        }
        // set slack referrer
        if (slackReferrerName !== false) {
            if (slackReferrerName) {
                await GlobalHelper.selectValues(
                    page,
                    `.settings-form .bp3-form-group:has(.bp3-label:has-text("${
                        Lang.text('settings.form.slackReferrer')
                    }")) .react-select__control`,
                    slackReferrerName
                );
            } else {
                await GlobalHelper.clearSelects(page);
            }
        }
        // set monthly recap
        const isChecked = await page.isChecked(
            '.settings-form .bp3-form-group .setting-monthlyRecap-switch input[type="checkbox"]'
        );
        if (isChecked !== monthlyRecap) {
            await page.click(
                '.settings-form .bp3-form-group .setting-monthlyRecap-switch .bp3-switch',
                { force: true }
            );
        }
        // submit form
        if (submitForm) {
            await Promise.all([
                page.click('.settings-form button.bp3-intent-primary:has(.bp3-icon-floppy-disk)'),
                GlobalHelper.waitAPI(page, 'setConfiguration'),
                GlobalHelper.waitAPI(page, 'setJob')
            ]);
        }
    },

    // deletes logo in general settings form
    async deleteLogo(page) {
        await page.click('.settings-form .settings-brandingLogo-container .settings-brandingLogo-icon');
    },

    // submit general settings form
    async submitForm(page, expectConfigFail = false) {
        const tasks = [
            page.click('.settings-form button.bp3-intent-primary:has(.bp3-icon-floppy-disk)'),
            GlobalHelper.waitAPI(page, 'setConfiguration')
        ];
        if (!expectConfigFail) {
            tasks.push(
                GlobalHelper.waitAPI(page, 'setJob')
            );
        }
        await Promise.all(tasks);
    }

};

module.exports = ConfigSettingsHelper;
