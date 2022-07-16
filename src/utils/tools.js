export const TruncLength = {
    TINY: 10,
    SHORT: 16,
    MEDIUM: 20,
    LONG: 30,
    VERYLONG: 50
};

const Tools = {

    buildUrl(...args) {
        const items = [];
        for (const arg of args) {
            items.push(Tools.trimChar(arg, '/'));
        }
        return items.join('/');
    },

    trimChar(str, char) {
        let string = str;
        while (string.charAt(0) === char) {
            string = string.substring(1);
        }
        while (string.charAt(string.length - 1) === char) {
            string = string.substring(0, string.length - 1);
        }
        return string;
    },

    // Truncate string to max LENGTH characters while trying to truncate it to last separator
    trunc(string, length = 50) {
        const wordSeparator = ' ?;:,.';
        if (string.length > length) {
            const truncatedString = string.slice(0, length);
            const indexes = [];
            for (const currentSeparator of wordSeparator) {
                indexes.push(truncatedString.lastIndexOf(currentSeparator));
            }
            const maxIndex = Math.max(...indexes);
            if (maxIndex !== -1) {
                return `${truncatedString.slice(0, maxIndex)}...`;
            }
            return `${truncatedString}...`;
        }
        return string;
    },

    // uppercases first char of string
    ucfirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    },

    // buffer timer to prevent too many execution in a period of time
    spamControlTimer: null,
    spamControl(callback, duration = 100) {
        if (Tools.spamControlTimer) {
            clearTimeout(Tools.spamControlTimer);
        }
        Tools.spamControlTimer = setTimeout(callback, duration);
    },

    // gère stockage / récupération d'object dans le localStorage
    getLocalStorageObject(key, defaultValue = null) {
        const localStorageValue = localStorage.getItem(key);
        if (localStorageValue !== null) {
            try {
                return JSON.parse(localStorageValue);
            } catch (err) {
                return defaultValue;
            }
        } else {
            return defaultValue;
        }
    },
    setLocalStorageObject(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },
    removeLocalStorageObject(key) {
        localStorage.removeItem(key);
    }

};

export default Tools;
