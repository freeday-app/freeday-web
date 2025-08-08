class FetchError extends Error {
    constructor(json) {
        super(json.error);
        this.code = json.code;
        this.data = json.data || null;
    }
}

const API = {

    isAuth: false,
    userId: null,

    setAuth(result) {
        this.userId = result?.userId;
        this.isAuth = true;
    },

    unsetAuth() {
        this.userId = null;
        this.isAuth = false;
    },

    async call(opts) {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (opts.token) {
            headers.Authorization = `Bearer ${opts.token}`;
        }
        const fetchOpts = { headers };
        if (opts.method) {
            fetchOpts.method = opts.method;
        }
        if (opts.data) {
            fetchOpts.body = JSON.stringify(opts.data);
        }
        const result = await fetch(opts.url, fetchOpts);
        if (result.ok) {
            return result.json();
        }
        const json = await result.json();
        throw new FetchError(json);
    }

};

export default API;
