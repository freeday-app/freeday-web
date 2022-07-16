const { test } = require('@playwright/test');

const DataHelper = require('./helpers/data.helper');
const GlobalHelper = require('./helpers/global.helper');
const ConfigHelper = require('./helpers/config.helper');
const ConfigSettingsHelper = require('./helpers/configSettings.helper');
const Lang = require('./helpers/lang.helper');
const ConfigurationData = require('./data/configuration.json');
const SlackChannelsData = require('./data/slackChannels.json');

const slackChannelsById = {};
for (const channel of SlackChannelsData) {
    slackChannelsById[channel.slackId] = channel;
}

const blankConfiguration = {
    brandingName: null,
    brandingLogo: null,
    slackReferrer: null
};

const altConfiguration = {
    brandingName: 'Random name',
    brandingLogo: 'logoAlt.png',
    slackReferrer: 'TGJ7ACX3Y'
};

const badReferrerConfiguration = {
    brandingName: null,
    brandingLogo: null,
    slackReferrer: 'TOHOIIDX9'
};

const badChannel = {
    slackId: 'TOHOIIDX9',
    name: 'Referrer test',
    isChannel: true,
    isGroup: false,
    isIm: false,
    isMpIm: false,
    isMember: false,
    isPrivate: false,
    archived: false
};

test.describe('[Settings configuration]', () => {
    test('Initializing tests', async ({ page }) => {
        page.setDefaultTimeout(5000);
        await DataHelper.resetAuth();
        await DataHelper.resetData();
        await DataHelper.setMonthlyRecap(null);
        await DataHelper.setConfiguration();
        await GlobalHelper.login(page);
        await GlobalHelper.changeLanguage(page, 'en');
    });

    test('Should have everything in its right place', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/config/settings'));
        await ConfigHelper.assertPage(page, 'settings');
        await GlobalHelper.assertSelectedNavButton(page, '/config/settings');
        await DataHelper.setConfiguration(blankConfiguration);
        await page.goto(GlobalHelper.url('/config/settings'));
        await ConfigSettingsHelper.assertForm(page);
        await DataHelper.setConfiguration();
        await page.goto(GlobalHelper.url('/config/settings'));
        await ConfigSettingsHelper.assertForm(
            page,
            ConfigurationData.brandingName,
            null,
            true,
            slackChannelsById[ConfigurationData.slackReferrer].name
        );
    });

    test('Should control file size and dimensions', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/config/settings'));
        await ConfigHelper.assertPage(page, 'settings');
        await ConfigSettingsHelper.fillForm(page, null, 'logoWrongSize.png');
        await GlobalHelper.assertToaster(page, 'error', Lang.text('settings.error.fileSize'));
        await ConfigSettingsHelper.fillForm(page, null, 'logoWrongDimensions.png');
        await GlobalHelper.assertToaster(page, 'error', Lang.text('settings.error.fileDimensions'));
    });

    test('Should change configuration', async ({ page }) => {
        await DataHelper.setConfiguration(blankConfiguration);
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/config/settings'));
        await ConfigHelper.assertPage(page, 'settings');
        await ConfigSettingsHelper.assertForm(page);
        await ConfigSettingsHelper.fillForm(
            page,
            altConfiguration.brandingName,
            altConfiguration.brandingLogo,
            slackChannelsById[altConfiguration.slackReferrer].name,
            true
        );
        await ConfigSettingsHelper.assertForm(
            page,
            altConfiguration.brandingName,
            altConfiguration.brandingLogo,
            true,
            slackChannelsById[altConfiguration.slackReferrer].name,
            true
        );
        await ConfigSettingsHelper.submitForm(page);
        const conf = await DataHelper.getConfiguration();
        const recap = await DataHelper.getMonthlyRecap();
        await GlobalHelper.assertHeader(
            page,
            conf.brandingName,
            conf.brandingLogo
        );
        await ConfigHelper.assertPage(page, 'settings');
        await ConfigSettingsHelper.assertForm(
            page,
            conf.brandingName,
            altConfiguration.brandingLogo,
            true,
            slackChannelsById[conf.slackReferrer].name,
            recap.enabled
        );
        await ConfigSettingsHelper.deleteLogo(page);
        await ConfigSettingsHelper.fillForm(page, '', null, null);
        await ConfigSettingsHelper.assertForm(page);
        await ConfigSettingsHelper.submitForm(page);
        await GlobalHelper.assertHeader(page, null, null);
        await ConfigSettingsHelper.fillForm(
            page,
            ConfigurationData.brandingName,
            'logo.png',
            slackChannelsById[ConfigurationData.slackReferrer].name,
            false
        );
        await ConfigSettingsHelper.assertForm(
            page,
            ConfigurationData.brandingName,
            'logo.png',
            true,
            slackChannelsById[ConfigurationData.slackReferrer].name,
            false
        );
        await ConfigSettingsHelper.submitForm(page);
        const confBis = await DataHelper.getConfiguration();
        const recapBis = await DataHelper.getMonthlyRecap();
        await GlobalHelper.assertHeader(
            page,
            confBis.brandingName,
            confBis.brandingLogo
        );
        await ConfigHelper.assertPage(page, 'settings');
        await ConfigSettingsHelper.assertForm(
            page,
            confBis.brandingName,
            'logo.png',
            true,
            slackChannelsById[confBis.slackReferrer].name,
            recapBis.enabled
        );
    });

    test('Should check if the bot was invited in the current slack referrer channel', async ({ page }) => {
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/config/settings'));
        await ConfigSettingsHelper.fillForm(
            page,
            badReferrerConfiguration.brandingName,
            badReferrerConfiguration.brandingLogo,
            slackChannelsById[badReferrerConfiguration.slackReferrer].name
        );
        await ConfigSettingsHelper.submitForm(page);
        await DataHelper.upsertSlackChannel(badChannel);
        await GlobalHelper.logout(page);
        await GlobalHelper.login(page);
        await page.goto(GlobalHelper.url('/config/settings'));
        await ConfigSettingsHelper.assertReferrerWarning(page);
        await ConfigSettingsHelper.submitForm(page, true);
        await GlobalHelper.assertToaster(page, 'error', Lang.text('settings.error.slackReferrer'));
    });
});
