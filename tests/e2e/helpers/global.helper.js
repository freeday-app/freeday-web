const { expect } = require('chai');
const DayJS = require('dayjs');
const AdvancedFormat = require('dayjs/plugin/advancedFormat');
require('dayjs/locale/fr');
require('dayjs/locale/en-gb');

DayJS.extend(AdvancedFormat);

const APIHelper = require('./api.helper');
const DataHelper = require('./data.helper');
const Lang = require('./lang.helper');
const ConfigurationData = require('../data/configuration.json');

const GlobalHelper = {

    // builds url for page navigation
    baseUrl: 'http://localhost:8788',
    url: (path) => `${GlobalHelper.baseUrl}${path}`,

    // wait for api requests
    apiRoutes: {
        loginAuth: { method: 'POST', pathRegex: /\/api\/auth$/ },
        logoutAuth: { method: 'DELETE', pathRegex: /\/api\/auth$/ },
        getDaysoff: { method: 'GET', pathRegex: /\/api\/daysoff(?:\?[a-zA-z0-9-,_&=%]+)?$/ },
        actionDayoff: { method: 'PUT', pathRegex: /\/api\/daysoff\/[0-9a-fA-F]+\/(?:confirm|cancel|reset)$/ },
        getUsers: { method: 'GET', pathRegex: /\/api\/users(?:\?[a-zA-z0-9-,_&=%]+)?$/ },
        createUser: { method: 'POST', pathRegex: /\/api\/users$/ },
        editUser: { method: 'POST', pathRegex: /\/api\/users\/[0-9a-fA-F]+$/ },
        deleteUser: { method: 'DELETE', pathRegex: /\/api\/users\/[0-9a-fA-F]+$/ },
        getDayoffTypes: { method: 'GET', pathRegex: /\/api\/daysoff\/types(?:\?[a-zA-z0-9-,_&=%]+)?$/ },
        createDayoffType: { method: 'POST', pathRegex: /\/api\/daysoff\/types$/ },
        editDayoffType: { method: 'POST', pathRegex: /\/api\/daysoff\/types\/[0-9a-fA-F]+$/ },
        setConfiguration: { method: 'POST', pathRegex: /\/api\/configuration$/ },
        setJob: { method: 'POST', pathRegex: /\/api\/jobs\/[a-zA-z0-9]+$/ }
    },
    async waitAPI(page, alias) {
        const route = GlobalHelper.apiRoutes[alias];
        if (!route) {
            throw new Error(`Invalid wait alias ${alias}`);
        }
        return page.waitForRequest((req) => (
            !!(req.method() === route.method && route.pathRegex.test(req.url()))
        ));
    },

    // asserts elements contains given emoji
    async containsEmoji(page, selector, emoji) {
        const ariaLabel = await page.getAttribute(`${selector} span.emoji-mart-emoji`, 'aria-label');
        expect(ariaLabel).to.include(emoji);
    },

    // asserts footer
    async assertFooter(page) {
        const footerContent = await page.textContent('#footer .footer-content');
        expect(footerContent).to.be.a('string').and.satisfy((text) => (
            text.startsWith(
                Lang.text('footer.text').replace(
                    '%s',
                    Lang.text('footer.brand')
                )
            )
        ));
    },

    // checks toasters
    async assertToaster(page, type, message, closeToaster = true) {
        let intent;
        if (type === 'success') {
            intent = 'success';
        } else if (type === 'error') {
            intent = 'danger';
        } else {
            throw new Error(`Unknown toaster type '${type}'`);
        }
        const toasterText = await page.textContent(`.bp4-intent-${intent} .bp4-toast-message`);
        expect(toasterText).to.equal(message);
        if (closeToaster) {
            await page.click('.bp4-toast .bp4-button:has(span[icon="cross"])');
            await page.waitForSelector(`.bp4-intent-${intent} .bp4-toast-message`, { state: 'detached' });
            const toaster = await page.$(`.bp4-intent-${intent} .bp4-toast-message`);
            expect(toaster).to.not.be.ok;
        }
    },

    // goes to login page and authenticate using conf variables by default
    async login(page, username = null, password = null) {
        await page.goto(GlobalHelper.url('/login'));
        await page.fill('.login-form input[name="username"]', username || APIHelper.username);
        await page.fill('.login-form input[name="password"]', password || APIHelper.password);
        await Promise.all([
            page.click('.login-form button[type="submit"]'),
            GlobalHelper.waitAPI(page, 'loginAuth')
        ]);
        await GlobalHelper.assertLogged(page);
    },

    // performs logout by clicking main menu button
    async logout(page) {
        await page.goto(GlobalHelper.url('/daysoff'));
        await page.click(`#nav .bp4-popover2-target:has-text("${Lang.text('nav.config')}")`);
        await Promise.all([
            page.click(`#nav-config .bp4-menu-item:has-text("${Lang.text('nav.logout')}")`),
            GlobalHelper.waitAPI(page, 'logoutAuth')
        ]);
        await GlobalHelper.assertLoggedOut(page);
    },

    // checks we are logged by searching for main page element
    async assertLogged(page) {
        await page.waitForSelector('.bp4-navbar-heading:has-text("Freeday")');
    },

    // checks we are logged out by searching for login page element
    async assertLoggedOut(page) {
        await page.waitForSelector('.login-form .login-header');
    },

    // changes client language through header language select
    async changeLanguage(page, langCode) {
        await GlobalHelper.blankClick(page);
        await page.click(`#nav .bp4-popover2-target:has-text("${Lang.text('nav.config')}")`);
        const languageMenuSelector = `#nav-config .bp4-popover-target:has(.bp4-menu-item .bp4-text-overflow-ellipsis:has-text("${
            Lang.text('nav.language')
        }"))`;
        await page.waitForSelector(languageMenuSelector);
        await page.hover(languageMenuSelector);
        const languageSubMenuSelector = `#nav-config .bp4-submenu .bp4-submenu .bp4-menu-item .bp4-text-overflow-ellipsis:has-text("${
            Lang.languages[langCode]
        }")`;
        await page.waitForSelector(languageSubMenuSelector);
        await page.click(languageSubMenuSelector);
        Lang.setCurrent(langCode);
        DayJS.locale(langCode);
    },

    // triggers tooltip on element and checks its content
    async assertTooltip(
        page,
        selector,
        expectedContent,
        expectedEmoji = null,
        isWithinDialog = false
    ) {
        await page.hover(selector);
        await page.waitForSelector('.bp4-tooltip2');
        const tooltipText = await page.textContent('.bp4-tooltip2');
        expect(tooltipText).to.equal(expectedContent);
        if (expectedEmoji) {
            await GlobalHelper.containsEmoji(page, '.bp4-tooltip2', expectedEmoji);
        }
        if (isWithinDialog) {
            await GlobalHelper.blankClickDialog(page);
        } else {
            await GlobalHelper.blankClick(page);
        }
        await page.waitForSelector('.bp4-tooltip2', {
            state: 'detached'
        });
    },

    // asserts that navigation button is currently active/selected
    async assertSelectedNavButton(page, navLinkHref) {
        if (navLinkHref.startsWith('/config')) {
            await page.waitForSelector(`#nav .tabs .bp4-tab:has-text("${Lang.text('nav.config')}")`);
        } else {
            await page.waitForSelector(`#nav .tabs .bp4-tab[aria-selected="true"]:has(a[href="${navLinkHref}"])`);
        }
    },

    // picks emoji in emoji picker
    async pickEmoji(page, emojiPickerSelector, emoji) {
        await page.click(emojiPickerSelector);
        if (emoji) {
            await page.fill('.emoji-mart section > input[type="search"]', emoji);
            await page.click(`:nth-match(.emoji-mart-scroll .emoji-mart-emoji, 1)[aria-label*="${emoji}"]`);
        } else {
            await page.click(':nth-match(.emoji-picker-clear, 1)');
        }
    },

    // assert react-select options
    async assertOptions(page, selectControlSelector, optionsTexts) {
        await page.click(selectControlSelector, { force: true });
        for (const text of optionsTexts) {
            await page.waitForSelector(
                `.react-select__menu-list .react-select__option:has-text("${text}")`
            );
        }
        const options = await page.$$('.react-select__menu-list .react-select__option');
        expect(options.length).to.equal(optionsTexts.length);
        await GlobalHelper.blankClick(page);
    },

    // select values in react-select
    async selectValues(page, selectSelector, vals, apiRouteToWait = null, isDialog = false) {
        const values = Array.isArray(vals) ? vals : [vals];
        await page.click(selectSelector, {
            position: {
                x: 10,
                y: 10
            }
        });
        for (const value of values) {
            const tasks = [
                page.click(`.react-select__menu-list .react-select__option:has-text("${value}")`)
            ];
            if (apiRouteToWait) {
                tasks.push(GlobalHelper.waitAPI(page, apiRouteToWait));
            }
            await Promise.all(tasks);
        }
        if (isDialog) {
            await GlobalHelper.blankClickDialog(page);
        } else {
            await GlobalHelper.blankClick(page);
        }
    },

    // clear all react-selects
    async clearSelects(page) {
        const clears = await page.$$('.react-select__clear-indicator');
        for await (const clear of clears) {
            await clear.click();
        }
    },

    // asserts navigation header
    async assertHeader(
        page,
        brandingName = ConfigurationData.brandingName,
        brandingLogoBase64 = ConfigurationData.brandingLogo
    ) {
        if (brandingLogoBase64) {
            await page.waitForSelector(
                `#nav .bp4-navbar-heading .nav-logo img[src="${brandingLogoBase64}"]`
            );
        } else {
            await GlobalHelper.containsEmoji(page, '#nav .bp4-navbar-heading .nav-logo', 'palm_tree');
        }
        await page.waitForSelector(
            `#nav .bp4-navbar-heading .nav-title:has-text("Freeday${brandingName ? ` ${brandingName}` : ''}")`
        );
        await page.waitForSelector(
            `#nav .tabs .bp4-tab a[href="/daysoff"]:has-text("${Lang.text('nav.daysoff')}")`
        );
        await page.waitForSelector(
            `#nav .tabs .bp4-tab a[href="/schedule"]:has-text("${Lang.text('nav.schedule')}")`
        );
        await page.waitForSelector(
            `#nav .tabs .bp4-tab a[href="/summary"]:has-text("${Lang.text('nav.summary')}")`
        );
        await page.click(
            `#nav .tabs .bp4-tab .bp4-popover2-target:has-text("${Lang.text('nav.config')}")`
        );
        await page.waitForSelector(
            `#nav-config a.bp4-menu-item:has-text("${Lang.text('nav.settings')}")`
        );
        await page.waitForSelector(
            `#nav-config a.bp4-menu-item:has-text("${Lang.text('nav.admins')}")`
        );
        await page.waitForSelector(
            `#nav-config a.bp4-menu-item:has-text("${Lang.text('nav.types')}")`
        );
        await page.waitForSelector(
            `#nav-config .bp4-popover-target .bp4-menu-item:has-text("${Lang.text('nav.language')}")`
        );
        await page.waitForSelector(
            `#nav-config .bp4-popover-target .bp4-menu-item:has-text("${Lang.text('nav.theme')}")`
        );
        await page.waitForSelector(
            `#nav-config a.bp4-menu-item:has-text("${Lang.text('nav.logout')}")`
        );
    },

    // visits page by clicking menu item
    async visitPageThroughMenu(page, menuItemKey) {
        if (menuItemKey === 'types' || menuItemKey === 'admins') {
            await page.click(`#nav .bp4-popover2-target:has-text("${Lang.text('nav.config')}")`);
            await page.click(`#nav-config .bp4-menu-item:has-text("${Lang.text(`nav.${menuItemKey}`)}")`);
        } else {
            await page.click(`#nav .tabs .bp4-tab:has-text("${Lang.text(`nav.${menuItemKey}`)}")`);
        }
    },

    // sets filter values
    async setFilter(page, opts = {}, waitDaysoffRouteCall = true) {
        // wrapper for filter fill + api wait
        const waitWrap = async (fillPromise, wait = false) => {
            const tasks = [fillPromise];
            if (wait) {
                tasks.push(GlobalHelper.waitAPI(page, 'getDaysoff'));
            }
            await Promise.all(tasks);
        };
        // set filter dates
        for (const name of ['start', 'end']) {
            if (opts[name]) {
                const dateInputSelector = `.filter .bp4-form-group:has(.bp4-label:has-text("${
                    Lang.text(`filter.${name}`)
                }")) input[type="text"]`;
                await page.fill(dateInputSelector, '');
                await waitWrap(
                    page.fill(dateInputSelector, DayJS(opts[name]).format(
                        Lang.text('date.format')
                    )),
                    waitDaysoffRouteCall
                );
                await GlobalHelper.blankClick(page);
            }
        }
        // sets filter period
        if (opts.month) {
            const monthName = Lang.text(`month.${opts.month}`, false);
            await waitWrap(
                GlobalHelper.selectValues(
                    page,
                    `.filter .bp4-form-group:has(.bp4-label:has-text("${
                        Lang.text('filter.month')
                    }")) .react-select__control`,
                    monthName
                ),
                waitDaysoffRouteCall
            );
        }
        if (opts.year) {
            const yearInputSelector = `.filter .bp4-form-group:has(.bp4-label:has-text("${
                Lang.text('filter.year')
            }")) input.bp4-input`;
            await page.fill(yearInputSelector, '');
            await waitWrap(
                page.fill(
                    yearInputSelector,
                    opts.year.toString()
                ),
                waitDaysoffRouteCall
            );
        }
        // sets filter selects
        for (const name of ['slackUsers', 'type', 'status']) {
            if (opts[name]) {
                await GlobalHelper.selectValues(
                    page,
                    `.filter .bp4-form-group:has(.bp4-label:has-text("${
                        Lang.text(`filter.${name}`)
                    }")) .react-select__control`,
                    opts[name],
                    waitDaysoffRouteCall ? 'getDaysoff' : null
                );
            }
        }
        // sets filter "all" checkbox
        if (opts.all) {
            const isChecked = await page.isChecked('.filter .bp4-switch input[type="checkbox"]');
            if (isChecked !== opts.all) {
                await waitWrap(
                    page.click('.filter .bp4-switch'),
                    waitDaysoffRouteCall
                );
            }
        }
    },

    // changes client theme through header theme select
    async changeTheme(page, theme) {
        await GlobalHelper.blankClick(page);
        await page.click(`#nav .bp4-popover2-target:has-text("${Lang.text('nav.config')}")`);
        const themeMenuSelector = `#nav-config .bp4-popover-target:has(.bp4-menu-item .bp4-text-overflow-ellipsis:has-text("${
            Lang.text('nav.theme')
        }"))`;
        await page.waitForSelector(themeMenuSelector);
        await page.hover(themeMenuSelector);
        const themeSubMenuSelector = `#nav-config .bp4-submenu .bp4-submenu .bp4-menu-item .bp4-text-overflow-ellipsis:has-text("${
            Lang.text(`theme.${theme}`)
        }")`;
        await page.waitForSelector(themeSubMenuSelector);
        await page.click(themeSubMenuSelector);
    },

    // checks support dialog content
    async assertSupportDialog(page) {
        const contactText = Lang.text('support.contact.text').replace(
            '%s',
            Lang.text('support.contact.email', false)
        );
        // ouverture menu admin
        await page.click(`#nav .bp4-popover2-target:has-text("${Lang.text('nav.config')}")`);
        // ouverture popin de support
        await page.click(`#nav-config .bp4-menu-item:has-text("${Lang.text('nav.support')}")`);
        // vérification du header
        await page.waitForSelector(`.bp4-dialog .bp4-heading:has-text("${Lang.text('nav.support')}")`);
        // vérification de la sélection du menu contact
        await page.waitForSelector(`.bp4-dialog .bp4-card .bp4-tab[aria-selected="true"]:has-text("${
            Lang.text('support.contact.title')
        }")`);
        // vérification du titre de la section contact
        await page.waitForSelector(`.bp4-dialog .bp4-card .bp4-tab-panel h2:has-text("${
            Lang.text('support.contact.title')
        }")`);
        // vérification du texte de la section contact
        await page.waitForSelector(`.bp4-dialog .bp4-card .bp4-tab-panel div:has-text("${contactText}")`);
        // vérification de l'email
        await page.waitForSelector(`.bp4-dialog .bp4-card .bp4-tab-panel a:has-text("${
            Lang.text('support.contact.email', false)
        }")`);
        // données pour check du contenu des onglets
        const tabData = [{
            tab: Lang.text('support.cgu.title'),
            title: Lang.text('support.cgu.titleLong')
        }, {
            tab: Lang.text('support.legal.title'),
            title: Lang.text('support.legal.title')
        }, {
            tab: Lang.text('support.data.title'),
            title: Lang.text('support.data.title')
        }];
        // parcoure les onglets et vérifie contenu
        for (const data of tabData) {
            // changement de section
            await page.click(`.bp4-dialog .bp4-card .bp4-tab:has-text("${data.tab}")`);
            // vérification titre
            await page.click(`.bp4-dialog .bp4-card .bp4-tab-panel h2:has-text("${data.title}")`);
        }
        // fermeture de la dialog
        await page.click('.bp4-dialog .bp4-dialog-close-button');
        await page.waitForSelector('.bp4-dialog', { state: 'detached' });
    },

    // asserts filter elements
    // available fields: start, end, month, year, slackUsers, type, status, all
    async assertFilter(page, fields) {
        const dayoffTypes = await DataHelper.getDayoffTypes(null, true);
        const slackUsers = await DataHelper.getSlackUsers();
        for (const name of ['start', 'end']) {
            if (fields.includes(name)) {
                await page.waitForSelector(
                    `.filter .bp4-form-group:has(.bp4-label:has-text("${
                        Lang.text(`filter.${name}`)
                    }")) .bp4-input`
                );
                await GlobalHelper.blankClick(page);
            }
        }
        if (fields.includes('month')) {
            await page.waitForSelector(
                `.filter .bp4-form-group:has(.bp4-label:has-text("${
                    Lang.text('filter.month')
                }")) .react-select__control`
            );
            for (const arrowSide of ['left', 'right']) {
                await page.waitForSelector(
                    `.filter .bp4-form-group:has(.bp4-label:has-text("${
                        Lang.text('filter.month')
                    }")) button span[icon="arrow-${arrowSide}"]`
                );
            }
        }
        if (fields.includes('year')) {
            for (const selector of [
                '.bp4-input',
                'button.bp4-button span[icon="chevron-up"]',
                'button.bp4-button span[icon="chevron-down"]'
            ]) {
                await page.waitForSelector(
                    `.filter .bp4-form-group:has(.bp4-label:has-text("${
                        Lang.text('filter.year')
                    }")) ${selector}`
                );
            }
        }
        if (fields.includes('slackUsers')) {
            await GlobalHelper.assertOptions(
                page,
                `.filter .bp4-form-group:has(.bp4-label:has-text("${
                    Lang.text('filter.slackUsers')
                }")) .react-select__control`,
                slackUsers.map((su) => su.name)
            );
        }
        if (fields.includes('type')) {
            await GlobalHelper.assertOptions(
                page,
                `.filter .bp4-form-group:has(.bp4-label:has-text("${
                    Lang.text('filter.type')
                }")) .react-select__control`,
                dayoffTypes.map((dt) => dt.name)
            );
        }
        if (fields.includes('status')) {
            await page.waitForSelector(
                `.filter .bp4-form-group:has(.bp4-label:has-text("${
                    Lang.text('filter.status')
                }")) .react-select__control`
            );
        }
        if (fields.includes('all')) {
            await page.waitForSelector(
                `.filter .bp4-form-group:has(.bp4-label:has-text("${
                    Lang.text('filter.all')
                }")) .bp4-switch`
            );
        }
    },

    // asserts filter values
    async assertFilterValues(page, opts = {}) {
        // asserts filter dates
        for (const name of ['start', 'end']) {
            if (opts[name]) {
                await page.waitForSelector(
                    `.filter .bp4-form-group:has(.bp4-label:has-text("${
                        Lang.text(`filter.${name}`)
                    }")) input[type="text"][value="${
                        DayJS(opts[name]).format(Lang.text('date.format'))
                    }"]`
                );
            }
        }
        // asserts filter period
        if (opts.month) {
            const monthName = Lang.text(`month.${opts.month}`, false);
            await page.waitForSelector(
                `.filter .bp4-form-group:has(.bp4-label:has-text("${
                    Lang.text('filter.month')
                }")) .react-select__control .react-select__single-value:has-text("${
                    monthName
                }")`
            );
        }
        if (opts.year) {
            await page.waitForSelector(
                `.filter .bp4-form-group:has(.bp4-label:has-text("${
                    Lang.text('filter.year')
                }")) input.bp4-input[value="${
                    opts.year.toString()
                }"]`
            );
        }
        // asserts filter selects
        for (const name of ['slackUsers', 'type', 'status']) {
            if (opts[name]) {
                if (name === 'slackUsers') {
                    for (const val of opts[name]) {
                        await page.waitForSelector(
                            `.filter .bp4-form-group:has(.bp4-label:has-text("${
                                Lang.text(`filter.${name}`)
                            }")) .react-select__control .react-select__multi-value .react-select__multi-value__label:has-text("${
                                val
                            }")`
                        );
                    }
                } else {
                    await page.waitForSelector(
                        `.filter .bp4-form-group:has(.bp4-label:has-text("${
                            Lang.text(`filter.${name}`)
                        }")) .react-select__control .react-select__single-value:has-text("${
                            opts[name]
                        }")`
                    );
                }
            }
        }
        // asserts filter "all" checkbox
        if (opts.all) {
            const isChecked = await page.isChecked('.filter .bp4-switch input[type="checkbox"]');
            expect(isChecked).to.equal(opts.all);
        }
    },

    // clicks on element (opens context menu) then confirms and asserts conflict dialog
    async assertConflict(page, contextMenuSelector) {
        await page.click(contextMenuSelector);
        await GlobalHelper.blankHover(page);
        await page.click(`.bp4-popover2 ul.bp4-menu li a.bp4-menu-item:has-text("${Lang.text('button.confirm')}")`);
        await page.waitForSelector(
            '.bp4-dialog.conflict-dialog .bp4-dialog-body .conflict-content .conflict-table .conflict-table-row .bp4-radio input[type="radio"]'
        );
        await page.waitForSelector(
            `.bp4-dialog-footer-actions .bp4-button:has-text("${Lang.text('button.confirm')}")`
        );
        await page.click(
            `.bp4-dialog-footer-actions .bp4-button:has-text("${Lang.text('button.cancel')}")`
        );
    },

    // clicks on element (opens context menu) then
    // confirms then handles conflict dialog
    // if selectAnotherOne is set to true selects
    // another dayoff than the default one in the conflict dialog
    async handleConflict(
        page,
        contextMenuSelector,
        assertResultPage = null,
        selectAnotherOne = false
    ) {
        await page.click(contextMenuSelector);
        await GlobalHelper.blankHover(page);
        await Promise.all([
            page.click(`.bp4-popover2 ul.bp4-menu li a.bp4-menu-item:has-text("${Lang.text('button.confirm')}")`),
            GlobalHelper.waitAPI(page, 'actionDayoff')
        ]);
        const radioSelector = '.bp4-dialog.conflict-dialog .bp4-dialog-body .conflict-content .conflict-table .conflict-table-row .bp4-radio input[type="radio"]';
        await page.waitForSelector(radioSelector);
        const allRadios = await page.$$(radioSelector);
        expect(allRadios).to.have.length.above(1);
        const checkedRadios = await page.$$('.conflict-table-row .bp4-radio input[type="radio"]:checked');
        expect(checkedRadios).to.have.lengthOf(1);
        const notCheckedRadios = await page.$$('.conflict-table-row .bp4-radio input[type="radio"]:not(:checked)');
        expect(notCheckedRadios).to.have.length.above(0);
        await page.click(`.conflict-table-row .bp4-radio:has(input[type="radio"]${selectAnotherOne ? ':not(:checked)' : ':checked'})`);
        const radios = await page.$$('.conflict-table-row .bp4-radio input[type="radio"]');
        const assertData = {};
        for (const radio of radios) {
            const value = await radio.getAttribute('value');
            const isChecked = await radio.isChecked();
            assertData[value] = isChecked ? 'confirmed' : 'canceled';
        }
        await Promise.all([
            page.click(`.bp4-dialog-footer-actions .bp4-button:has-text("${Lang.text('button.confirm')}")`),
            GlobalHelper.waitAPI(page, 'actionDayoff'),
            GlobalHelper.waitAPI(page, 'getDaysoff')
        ]);
        if (assertResultPage === 'daysoff') {
            for (const dayoffId of Object.keys(assertData)) {
                await page.waitForSelector(
                    `#dayoff-table tr[data-dayoffid="${dayoffId}"] .dayoff-status p:has-text("${
                        Lang.text(`dayoff.status.${assertData[dayoffId]}`)
                    }")`
                );
            }
        } else if (assertResultPage === 'schedule') {
            for (const dayoffId of Object.keys(assertData)) {
                if (assertData[dayoffId] === 'confirmed') {
                    await page.waitForSelector(
                        `.scheduler-table-body-event[data-dayoffid="${dayoffId}"][class*="scheduler-table-green"]`
                    );
                }
            }
        }
    },

    // asserts that react-select has single value selected
    async assertSingleValue(page, selectControlSelector, value) {
        await page.waitForSelector(
            `${selectControlSelector} .react-select__value-container--has-value .react-select__single-value:has-text("${value}")`
        );
    },

    // click in blank zone
    async blankClick(page) {
        await page.click('#nav .bp4-navbar-heading', {
            position: {
                x: 10,
                y: 10
            }
        });
    },

    // click in blank zone of a dialog popup
    async blankClickDialog(page) {
        await page.click('.bp4-dialog .bp4-heading', {
            position: {
                x: 10,
                y: 10
            }
        });
    },

    // hover a blank zone
    async blankHover(page) {
        await page.hover('#nav .bp4-navbar-heading', {
            position: {
                x: 10,
                y: 10
            }
        });
    },

    // resets filter
    async resetFilter(page) {
        await Promise.all([
            page.click('.filter .filter-reset'),
            GlobalHelper.waitAPI(page, 'getDaysoff')
        ]);
    },

    // clicks button in dialog
    async clickDialogButton(page, text) {
        await page.click(`.bp4-dialog .bp4-button-text:has-text("${text}")`);
    }

};

module.exports = GlobalHelper;
