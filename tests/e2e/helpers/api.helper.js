const Axios = require('axios');

const APIHelper = {

    baseUrl: 'http://localhost:8788',
    token: null,
    username: process.env.TEST_USERNAME,
    password: process.env.TEST_PASSWORD,

    async request(opts) {
        const options = {
            url: `${APIHelper.baseUrl}${opts.url}`,
            method: opts.method ? opts.method : 'get',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        if (opts.body) {
            options.data = opts.body;
        }
        if (APIHelper.token) {
            options.headers.Authorization = APIHelper.token;
        }
        try {
            const response = await Axios(options);
            return response;
        } catch (err) {
            if (opts.ignoreError) {
                return err.response;
            }
            const { status, data } = err.response;
            throw new Error(`HTTP error ${status} ${JSON.stringify(data)}`);
        }
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
