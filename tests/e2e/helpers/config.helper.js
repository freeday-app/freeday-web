const { expect } = require('chai');

const GlobalHelper = require('./global.helper');
const Lang = require('./lang.helper');

const ConfigHelper = {

    // change config tab through tabs
    async selectTab(page, name) {
        await page.click(
            `#config .config-top .config-header .tabs .bp4-tab-list .bp4-tab:has-text("${Lang.text(`nav.${name}`)}")`
        );
        await page.waitForSelector(
            `#config .config-top .config-header .tabs .bp4-tab-list .bp4-tab[aria-selected="true"]:has-text("${Lang.text(`nav.${name}`)}")`
        );
    },

    // displays config creation by clicking create button
    async create(page, name) {
        await page.click(
            `#config .config-main .config-buttons button:has-text("${Lang.text(`${name}.create`)}")`
        );
    },

    // edits config element by clicking edit button with given id
    async edit(page, id) {
        await page.click(
            `#config .config-main .config-list-table tbody tr[data-id="${id}"] td.config-list-buttons button .bp4-icon[icon="edit"]`
        );
    },

    // deletes config element by clicking delete button with given id
    async delete(page, id) {
        await page.click(
            `#config .config-main .config-list-table tbody tr[data-id="${id}"] td.config-list-buttons button .bp4-icon[icon="trash"]`
        );
    },

    // clicks cancel button
    async cancel(page) {
        await page.click(
            `#config .config-form .config-form-buttons button:has-text("${Lang.text('button.cancel')}")`
        );
    },

    // checks elements of config page
    async assertPage(page, name) {
        let columns;
        let buttonLanguageKey;
        switch (name) {
            case 'settings':
                columns = null;
                buttonLanguageKey = null;
                break;
            case 'admins':
                columns = [
                    Lang.text('admin.form.username')
                ];
                buttonLanguageKey = 'admin';
                break;
            case 'types':
                columns = [
                    Lang.text('dayoffType.form.name'),
                    Lang.text('dayoffType.form.emoji'),
                    Lang.text('dayoffType.form.enabled'),
                    Lang.text('dayoffType.form.displayed'),
                    Lang.text('dayoffType.form.important')
                ];
                buttonLanguageKey = 'dayoffType';
                break;
            default:
        }
        await page.waitForSelector(
            `#config .config-top .config-header h4:has-text("${Lang.text('nav.config')}")`
        );
        await page.waitForSelector(
            `#config .config-top .config-header .tabs .bp4-tab:has-text("${Lang.text('nav.admins')}")`
        );
        await page.waitForSelector(
            `#config .config-top .config-header .tabs .bp4-tab:has-text("${Lang.text('nav.types')}")`
        );
        await page.waitForSelector(
            `#config .config-top .config-header .tabs .bp4-tab-list .bp4-tab[aria-selected="true"]:has-text("${Lang.text(`nav.${name}`)}")`
        );
        if (buttonLanguageKey) {
            await page.waitForSelector(
                `#config .config-main .config-buttons button.bp4-intent-primary:has-text("${Lang.text(`${buttonLanguageKey}.create`)}")`
            );
        }
        if (columns) {
            const thLength = await page.$$eval('#config .config-main .config-list-table thead th', (th) => th.length);
            expect(thLength).to.equal(columns.length + 1);
            for (const column of columns) {
                await page.waitForSelector(
                    `#config .config-main .config-list-table thead th:has-text("${column}")`
                );
            }
        }
    },

    // assert config list content
    async assertList(page, rows, buttons) {
        const trLength = await page.$$eval('#config .config-main .config-list-table tbody tr', (tr) => tr.length);
        expect(trLength).to.equal(rows.length);
        for (let i = 0; i < rows.length; i += 1) {
            const row = rows[i];
            for (let j = 0; j < row.length; j += 1) {
                const cell = row[j];
                if (cell.type) {
                    if (cell.value) {
                        if (cell.type === 'tooltip') {
                            const expectedContent = (cell.value.length > 30)
                                ? `${cell.value.substring(0, cell.value.indexOf('&') + 1)}...`
                                : cell.value;
                            const cellSelector = `:nth-match(#config .config-main .config-list-table tbody tr, ${i + 1}) >> :nth-match(td, ${j + 1}) >> .truncated-cell`;
                            const truncatedText = await page.textContent(cellSelector);
                            expect(truncatedText).to.equal(expectedContent);
                            await GlobalHelper.assertTooltip(page, cellSelector, cell.value);
                        } else if (cell.type === 'emoji') {
                            await GlobalHelper.containsEmoji(
                                page,
                                `:nth-match(#config .config-main .config-list-table tbody tr, ${i + 1}) >> :nth-match(td, ${j + 1})`,
                                cell.value
                            );
                        } else if (cell.type === 'tick') {
                            await page.waitForSelector(
                                `:nth-match(#config .config-main .config-list-table tbody tr, ${i + 1}) >> :nth-match(td, ${j + 1}) >> .bp4-icon[icon="tick"]`
                            );
                        }
                    } else {
                        const tdText = await page.textContent(
                            `:nth-match(#config .config-main .config-list-table tbody tr, ${i + 1}) >> :nth-match(td, ${j + 1})`
                        );
                        expect(tdText).to.be.empty;
                    }
                } else {
                    const cellSelector = `:nth-match(#config .config-main .config-list-table tbody tr, ${i + 1}) >> :nth-match(td, ${j + 1})`;
                    const cellInnerSelector = `${cellSelector} >> .config-name-inner`;
                    const cellInner = await page.$(cellInnerSelector);
                    if (cellInner) {
                        const cellInnerText = await page.textContent(cellInnerSelector);
                        expect(cellInnerText).to.equal(cell);
                    } else {
                        const cellText = await page.textContent(cellSelector);
                        expect(cellText).to.equal(cell);
                    }
                }
            }
            for (const button of buttons) {
                let icon;
                switch (button) {
                    case 'edit':
                        icon = 'edit';
                        break;
                    case 'delete':
                        icon = 'trash';
                        break;
                    default:
                        icon = null;
                }
                await page.waitForSelector(
                    `:nth-match(#config .config-main .config-list-table tbody tr, ${i + 1}) >> td.config-list-buttons button .bp4-icon[icon="${icon}"]`
                );
            }
        }
    }

};

module.exports = ConfigHelper;
