import DayJS from 'dayjs';
// charger des locales dayjs supplémentaires ici si besoin
import 'dayjs/locale/fr';
import 'dayjs/locale/en-gb';

import Tools from './tools';

import enData from '../lang/en.json';
import frData from '../lang/fr.json';

import enSupportData from '../lang/support.en.json';
import frSupportData from '../lang/support.fr.json';

const Language = {

    default: 'en',
    current: 'en',

    languages: {
        en: {
            name: 'English',
            data: {
                ...enData,
                ...enSupportData
            },
            emoji: 'uk'
        },
        fr: {
            name: 'Français',
            data: {
                ...frData,
                ...frSupportData
            },
            emoji: 'flag-fr'
        }
    },

    setCurrent(languageCode) {
        const lng = languageCode || Language.default;
        Language.current = lng;
        DayJS.locale(lng);
    },

    list() {
        return Object.keys(Language.languages).map((code) => ({
            code,
            name: Language.languages[code].name
        }));
    },

    get(code) {
        if (Language.languages[code]) {
            return {
                code,
                name: Language.languages[code].name
            };
        }

        return null;
    },

    text(path, ucfirst = true) {
        const code = Language.current || Language.default;
        let text = Language.languages[code].data;
        path.split('.').forEach((p) => {
            if (Object.hasOwnProperty.call(text, p)) {
                text = text[p];
            }
        });
        const legitTypes = ['string', 'number', 'boolean'];
        const textType = typeof text;
        if (text === null || !legitTypes.includes(textType)) {
            console.error(`Language error: text \`${path}\` not found for language \`${code}\``);
            return null;
        }
        if (textType === 'string' && ucfirst) {
            return Tools.ucfirst(text);
        }

        return text;
    },

    data(path) {
        const code = Language.current || Language.default;
        let { data } = Language.languages[code];
        path.split('.').forEach((p) => {
            if (Object.hasOwnProperty.call(data, p)) {
                data = data[p];
            }
        });
        if (data === null || typeof data !== 'object') {
            console.error(`Language error: data \`${path}\` not found for language \`${code}\``);
            return null;
        }

        return data;
    }

};

export default Language;
