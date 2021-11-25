import API from './api.js';

const Configuration = {

    data: null,

    async load() {
        Configuration.data = await API.call({
            method: 'GET',
            url: '/api/configuration'
        });
    }

};

export default Configuration;
