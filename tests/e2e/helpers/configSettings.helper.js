const { expect } = require('chai');
const Path = require('path');

const DataHelper = require('./data.helper');
const GlobalHelper = require('./global.helper');
const Lang = require('./lang.helper');

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
        const brandingInputSelector = `.settings-form .bp4-form-group:has(.bp4-label:has-text("${
            Lang.text('settings.form.brandingName')
        }")) .bp4-form-content .bp4-input-group:has(.bp4-icon-annotation) input.bp4-input`;
        await page.waitForSelector(brandingInputSelector);
        const brandingInputValue = await page.$eval(brandingInputSelector, (el) => el.value);
        expect(brandingInputValue).to.equal(brandingName || '');
        // checks brandingLogo label and input
        await page.waitForSelector(
            `.settings-form .bp4-form-group:has(.bp4-label:has-text("${
                Lang.text('settings.form.brandingLogo')
            }")) .bp4-form-content .bp4-file-input .bp4-file-upload-input:has-text("${
                brandingLogoFileName || '...'
            }")`
        );
        if (isbrandingLogo) {
            await page.waitForSelector(
                '.settings-form .settings-branding-logo-container img.settings-branding-logo-image[src^="data:image/png;base64,"]'
            );
            await page.waitForSelector(
                '.settings-form .settings-branding-logo-container .bp4-icon-trash.settings-branding-logo-icon'
            );
        } else {
            await page.waitForSelector('.settings-form .settings-branding-logo-container', {
                state: 'detached'
            });
        }
        // checks slack referrer label and select
        await GlobalHelper.assertOptions(
            page,
            `.settings-form .bp4-form-group:has(.bp4-label:has-text("${
                Lang.text('settings.form.slackReferrer')
            }")) .react-select__control`,
            slackChannels.map((c) => c.name)
        );
        await GlobalHelper.assertTooltip(
            page,
            `.settings-form .bp4-form-group:has(.bp4-label:has-text("${
                Lang.text('settings.form.slackReferrer')
            }")) .summary-csv-helper .bp4-icon[icon="help"]`,
            Lang.text('settings.form.slackReferrerHelper')
        );
        if (slackReferrerName) {
            await page.waitForSelector(
                `.settings-form .bp4-form-group:has(.bp4-label:has-text("${
                    Lang.text('settings.form.slackReferrer')
                }")) .react-select__control .react-select__single-value:has-text("${
                    slackReferrerName
                }")`
            );
        } else {
            await page.waitForSelector(
                `.settings-form .bp4-form-group:has(.bp4-label:has-text("${
                    Lang.text('settings.form.slackReferrer')
                }")) .react-select__control .react-select__single-value`,
                { state: 'detached' }
            );
        }
        // checks monthly recap job
        await page.waitForSelector(
            `.settings-form .bp4-form-group .bp4-switch:has-text("${
                Lang.text('settings.form.monthlyRecap')
            }")`
        );
        await GlobalHelper.assertTooltip(
            page,
            '.settings-form .settings-monthly-recap-container .summary-csv-helper .bp4-icon',
            Lang.text('settings.form.monthlyRecapHelper')
        );
        const isChecked = await page.isChecked(
            '.settings-form .bp4-form-group .setting-monthly-recap-switch input[type="checkbox"]'
        );
        if (monthlyRecap) {
            expect(isChecked).to.be.true;
        } else {
            expect(isChecked).to.be.false;
        }
        // checks button
        await page.waitForSelector(
            `.settings-form button.bp4-intent-primary:has(.bp4-icon-floppy-disk) .bp4-button-text:has-text("${
                Lang.text('button.save')
            }")`
        );
    },

    // Tests that a warning is displayed when the current slack referrer is invalid
    async assertReferrerWarning(page) {
        await page.waitForSelector(
            `.settings-slack-referrer-error:has-text("${
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
            `.settings-form .bp4-form-group:has(.bp4-label:has-text("${
                Lang.text('settings.form.brandingName')
            }")) input.bp4-input`,
            brandingName || ''
        );
        // set brandingLogo
        if (brandingLogoFileName) {
            await page.setInputFiles(
                `.settings-form .bp4-form-group:has(.bp4-label:has-text("${
                    Lang.text('settings.form.brandingLogo')
                }")) .bp4-form-content .bp4-file-input input[type="file"]`,
                Path.join(__dirname, `../data/images/${brandingLogoFileName}`)
            );
        }
        // set slack referrer
        if (slackReferrerName !== false) {
            if (slackReferrerName) {
                await GlobalHelper.selectValues(
                    page,
                    `.settings-form .bp4-form-group:has(.bp4-label:has-text("${
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
            '.settings-form .bp4-form-group .setting-monthly-recap-switch input[type="checkbox"]'
        );
        if (isChecked !== monthlyRecap) {
            await page.click(
                '.settings-form .bp4-form-group .setting-monthly-recap-switch .bp4-switch',
                { force: true }
            );
        }
        // submit form
        if (submitForm) {
            await Promise.all([
                page.click('.settings-form button.bp4-intent-primary:has(.bp4-icon-floppy-disk)'),
                GlobalHelper.waitAPI(page, 'setConfiguration'),
                GlobalHelper.waitAPI(page, 'setJob')
            ]);
        }
    },

    // deletes logo in general settings form
    async deleteLogo(page) {
        await page.click('.settings-form .settings-branding-logo-container .settings-branding-logo-icon');
    },

    // submit general settings form
    async submitForm(page, expectConfigFail = false) {
        const tasks = [
            page.click('.settings-form button.bp4-intent-primary:has(.bp4-icon-floppy-disk)'),
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
