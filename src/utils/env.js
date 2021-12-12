const Env = {
    current: process.env.REACT_APP_ENV === 'dev' ? 'dev' : 'prod',

    vars: {
        apiUrl: [
            'REACT_APP_API_PUBLIC_URL',
            'API_PUBLIC_URL'
        ]
    },

    get(name) {
        const keys = Env.vars[name];
        if (!keys) {
            throw new Error(`Unexpected name ${name} while getting environment variable`);
        }
        let value;
        keys.forEach((key) => {
            if (process.env[key]) {
                value = process.env[key];
            }
        });
        if (Env.current === 'prod' && window) {
            keys.forEach((key) => {
                if (window[key]) {
                    value = window[key];
                }
            });
        }
        return value;
    }

};

module.exports = Env;
