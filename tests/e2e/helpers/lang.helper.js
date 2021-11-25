const English = require('../../../src/lang/en.json');
const French = require('../../../src/lang/fr.json');
const EnglishSupport = require('../../../src/lang/support.en.json');
const FrenchSupport = require('../../../src/lang/support.fr.json');

const Lang = {

    current: 'en',
    data: {
        en: {
            ...English,
            ...EnglishSupport
        },
        fr: {
            ...French,
            FrenchSupport
        }
    },
    languages: {
        en: 'English',
        fr: 'Français'
    },

    ucfirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    text(textKey, ucfirsted = true) {
        let text = Lang.data[Lang.current];
        const split = textKey.split('.');
        for (const k of split) {
            if (!text[k]) {
                return null;
            }
            text = text[k];
        }
        return ucfirsted ? Lang.ucfirst(text) : text;
    },

    setCurrent(lang) {
        Lang.current = lang;
    }

};

module.exports = Lang;
