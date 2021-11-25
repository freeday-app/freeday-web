import Tools from './tools.js';

class FetchError extends Error {
    constructor(json) {
        super(json.error);
        this.code = json.code;
        this.data = json.data || null;
    }
}

const API = {

    apiUrl: process.env.REACT_APP_API_URL,
    isAuth: false,
    token: null,
    userId: null,

    setAuth(authData) {
        this.token = authData.token;
        this.userId = authData.userId;
        Tools.setLocalStorageObject('auth', authData);
        this.isAuth = true;
    },

    unsetAuth() {
        this.token = null;
        this.userId = null;
        Tools.removeLocalStorageObject('auth');
        this.isAuth = false;
    },

    async call(opts) {
        const fullUrl = new URL(opts.url, this.apiUrl).href;
        const headers = {
            'Content-Type': 'application/json'
        };
        if (opts.token) {
            headers.Authorization = `Bearer ${opts.token}`;
        } else if (this.token !== null) {
            headers.Authorization = `Bearer ${this.token}`;
        }
        const fetchOpts = { headers };
        if (opts.method) {
            fetchOpts.method = opts.method;
        }
        if (opts.data) {
            fetchOpts.body = JSON.stringify(opts.data);
        }
        const result = await fetch(fullUrl, fetchOpts);
        if (result.ok) {
            return result.json();
        }
        const json = await result.json();
        // console.error(`Fetch error ${result.status} ${JSON.stringify(json)}`);
        throw new FetchError(json);
    }

};

export default API;
