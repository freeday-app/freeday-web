const Fetch = require('node-fetch');

const APIHelper = {

    baseUrl: process.env.REACT_APP_API_PUBLIC_URL,
    token: null,

    async request(opts) {
        const options = {
            method: opts.method ? opts.method : 'get',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        if (opts.body) {
            options.body = JSON.stringify(opts.body);
        }
        if (APIHelper.token) {
            options.headers.Authorization = APIHelper.token;
        }
        const response = await Fetch(`${APIHelper.baseUrl}${opts.url}`, options);
        response.data = await response.json();
        if (opts.ignoreError || response.ok) {
            return response;
        }
        throw new Error(`Fetch request error: ${JSON.stringify(response.data)}`);
    },

    async auth(username, password) {
        const response = await APIHelper.request({
            method: 'post',
            url: '/api/auth',
            body: {
                username,
                password
            }
        });
        APIHelper.token = response.data.token;
        return response.data;
    }

};

module.exports = APIHelper;
