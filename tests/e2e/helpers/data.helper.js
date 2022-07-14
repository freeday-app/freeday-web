const { expect } = require('chai');

const APIHelper = require('./api.helper');

const AuthData = require('../data/auth.json');
const SlackUsersData = require('../data/slackUsers.json');
const SlackChannelsData = require('../data/slackChannels.json');
const DayoffTypesData = require('../data/dayoffTypes.json');
const DaysoffData = require('../data/daysoff.json');
const ConfigurationData = require('../data/configuration.json');

const DataHelper = {

    // creates user for requesting data if not exist
    // performs auth on api with created data user
    selfUserId: null,
    async resetAuth() {
        // logs with e2e user
        const testUser = await APIHelper.auth(AuthData.username, AuthData.password);
        await APIHelper.request({
            method: 'post',
            url: `/api/users/${testUser.userId}`,
            body: {
                language: 'en'
            }
        });
        const userResponse = await APIHelper.request({
            method: 'post',
            url: '/api/users',
            body: {
                username: `${AuthData.username}-data`,
                password: `${AuthData.password}-data`
            },
            ignoreError: true
        });
        expect(userResponse.status).to.be.oneOf([200, 409]);
        const user = await APIHelper.auth(`${AuthData.username}-data`, `${AuthData.password}-data`);
        DataHelper.selfUserId = user.userId;
    },

    // gets daysoff data filtered on certain period and sort by slack user name and date
    async getDaysoff(start = null, end = null, slackUserNames = null, type = null) {
        // parameters for api request
        const params = [];
        if (start) { params.push(`start=${start}`); }
        if (end) { params.push(`end=${end}`); }
        if (type) { params.push(`type=${type}`); }
        const reqParams = params.length > 0 ? `?${params.join('&')}` : '';
        // logs into api and gets token
        const response = await APIHelper.request({
            method: 'get',
            url: `/api/daysoff${reqParams}`
        });
        const { daysoff } = response.data;
        // filters daysoff by slack user names
        const filteredDaysoff = daysoff.filter((dayoff) => (
            !slackUserNames || slackUserNames.includes(dayoff.slackUser.name)
        ));
        // sorts daysoff by slack user name and date
        filteredDaysoff.sort((a, b) => {
            if (a.slackUser.name < b.slackUser.name) { return -1; }
            if (a.slackUser.name > b.slackUser.name) { return 1; }

            const dateA = new Date(a.start);
            const dateB = new Date(b.start);
            if (dateA < dateB) { return -1; }
            if (dateA > dateB) { return 1; }
            return 0;
        });
        // returns processed data
        return filteredDaysoff;
    },

    // randomly insert dayoff type ids in daysoff data
    insertDayoffTypeIds(dayoffTypes) {
        let dtIdx = 0;
        for (let i = 0; i < DaysoffData.length; i += 1) {
            if (dtIdx > dayoffTypes.length - 1) {
                dtIdx = 0;
            }
            DaysoffData[i].type = dayoffTypes[dtIdx].id;
            dtIdx += 1;
        }
    },

    // clear all existing data and creates test data
    async resetData() {
        await DataHelper.createSlackChannels(SlackChannelsData);
        await DataHelper.setConfiguration(ConfigurationData);
        const daysoff = await DataHelper.getDaysoff();
        await DataHelper.deleteDaysoff(daysoff);
        const dayoffTypes = await DataHelper.getDayoffTypes();
        await DataHelper.deleteDayoffTypes(dayoffTypes);
        await DataHelper.createDayoffTypes(DayoffTypesData);
        const createdDayoffTypes = await DataHelper.getDayoffTypes();
        DataHelper.insertDayoffTypeIds(createdDayoffTypes);
        await DataHelper.createSlackUsers(SlackUsersData);
        await DataHelper.createDaysoff(DaysoffData);
    },

    // gets configuration
    async getConfiguration() {
        const response = await APIHelper.request({
            method: 'get',
            url: '/api/configuration'
        });
        return response.data;
    },

    // gets monthlyRecap job settings
    async getMonthlyRecap() {
        const response = await APIHelper.request({
            method: 'get',
            url: '/api/jobs/monthlyRecap'
        });
        return response.data;
    },

    // sets monthlyRecap job settings
    async setMonthlyRecap(data = null) {
        const defaultData = {
            enabled: false,
            dayOfMonth: '28',
            hour: '8',
            minute: '0'
        };
        const response = await APIHelper.request({
            method: 'post',
            url: '/api/jobs/monthlyRecap',
            body: data || defaultData
        });
        return response.data;
    },

    // creates slack users if not exist
    async createSlackUsers(sUsers) {
        const slackUsers = JSON.parse(JSON.stringify(sUsers));
        const recCreateSlackUsers = async (users) => {
            const slackUser = users.shift();
            if (slackUser) {
                const response = await APIHelper.request({
                    method: 'post',
                    url: '/api/slack/users',
                    body: slackUser,
                    ignoreError: true
                });
                expect(response.status).to.be.oneOf([200, 409]);
                await recCreateSlackUsers(users);
            }
        };
        await recCreateSlackUsers(slackUsers);
    },

    // gets slack users
    async getSlackUsers() {
        const response = await APIHelper.request({
            method: 'get',
            url: '/api/slack/users?page=all&deleted=false'
        });
        return response.data.slackUsers;
    },

    // creates slack channels if not exist
    async createSlackChannels(sChannels) {
        const slackChannels = JSON.parse(JSON.stringify(sChannels));
        const recCreateSlackChannels = async (channels) => {
            const slackChannel = channels.shift();
            if (slackChannel) {
                const response = await APIHelper.request({
                    method: 'post',
                    url: '/api/slack/channels',
                    body: slackChannel,
                    ignoreError: true
                });
                expect(response.status).to.be.oneOf([200, 409]);
                await recCreateSlackChannels(channels);
            }
        };
        await recCreateSlackChannels(slackChannels);
    },

    async upsertSlackChannel(sChannel) {
        const slackChannel = JSON.parse(JSON.stringify(sChannel));
        await APIHelper.request({
            method: 'post',
            url: '/api/slack/channels',
            body: slackChannel
        });
    },

    // gets slack channels
    async getSlackChannels() {
        const response = await APIHelper.request({
            method: 'get',
            url: '/api/slack/channels?page=all&onlyMember=true'
        });
        return response.data.slackChannels;
    },

    // set configuration
    async setConfiguration(conf = ConfigurationData) {
        const configuration = JSON.parse(JSON.stringify(conf));
        await APIHelper.request({
            method: 'post',
            url: '/api/configuration',
            body: configuration
        });
    },

    // creates dayoff types
    async createDayoffTypes(dTypes) {
        const dayoffTypes = JSON.parse(JSON.stringify(dTypes));
        const recCreateDayoffTypes = async (types) => {
            const dayoffType = types.shift();
            if (dayoffType) {
                await APIHelper.request({
                    method: 'post',
                    url: '/api/daysoff/types',
                    body: dayoffType
                });
                await recCreateDayoffTypes(types);
            }
        };
        return recCreateDayoffTypes(dayoffTypes);
    },

    // deletes a list of dayoff types
    async deleteDayoffTypes(dTypes) {
        const dayoffTypes = JSON.parse(JSON.stringify(dTypes));
        const recDeleteDayoffTypes = async (types) => {
            const dayoffType = types.shift();
            if (dayoffType) {
                await APIHelper.request({
                    method: 'delete',
                    url: `/api/daysoff/types/${dayoffType.id}`
                });
                await recDeleteDayoffTypes(types);
            }
        };
        return recDeleteDayoffTypes(dayoffTypes);
    },

    // creates a dayoff
    async createDayoff(dayoff, force = false) {
        const response = await APIHelper.request({
            method: 'post',
            url: '/api/daysoff',
            body: {
                ...dayoff,
                ...(force ? { force: true } : {})
            }
        });
        return response.data;
    },

    // creates a list of daysoff
    async createDaysoff(data) {
        const daysoff = JSON.parse(JSON.stringify(data));
        const recCreateDaysoff = async (ds) => {
            const dayoff = ds.shift();
            if (dayoff) {
                await DataHelper.createDayoff({
                    type: dayoff.type,
                    slackUserId: dayoff.slackUserId,
                    start: dayoff.start,
                    end: dayoff.end,
                    startPeriod: dayoff.startPeriod,
                    endPeriod: dayoff.endPeriod,
                    comment: dayoff.comment
                });
                await recCreateDaysoff(ds);
            }
        };
        return recCreateDaysoff(daysoff);
    },

    // deletes a list of dayoff
    async deleteDaysoff(doff) {
        const daysoff = JSON.parse(JSON.stringify(doff));
        const recDeleteDaysoff = async (ds) => {
            const dayoff = ds.shift();
            if (dayoff) {
                await APIHelper.request({
                    method: 'delete',
                    url: `/api/daysoff/${dayoff.id}`
                });
                await recDeleteDaysoff(ds);
            }
        };
        await recDeleteDaysoff(daysoff);
    },

    // deletes a dayoff
    async deleteDayoff(dayoff) {
        await APIHelper.request({
            method: 'delete',
            url: `/api/daysoff/${dayoff.id}`
        });
    },

    // takes given action on all daysoff in database
    // if array of actions is provided, performs actions in order
    // in case of a null value in action array, no action is taken
    async takeActionOnAllDaysoff(action) {
        let actionTaken;
        let actionIndex = 0;
        const daysoff = await DataHelper.getDaysoff();
        // recursive action function
        const takeAction = async (ds) => {
            const dayoff = ds.shift();
            if (dayoff) {
                // if action is an array pick random action from it
                if (Array.isArray(action)) {
                    actionTaken = action[actionIndex];
                    actionIndex += 1;
                    if (actionIndex > action.length - 1) {
                        actionIndex = 0;
                    }
                } else {
                    actionTaken = action;
                }
                if (actionTaken) {
                    // take action on dayoff
                    await APIHelper.request({
                        method: 'put',
                        url: `/api/daysoff/${dayoff.id}/${actionTaken}`
                    });
                    await takeAction(ds);
                }
                await takeAction(ds);
            }
        };
        // take action on all daysoff
        await takeAction(daysoff);
    },

    // gets users list
    async getUsers() {
        const response = await APIHelper.request({
            method: 'get',
            url: '/api/users'
        });
        return response.data.users;
    },

    // delete created test users
    async deleteTestUsers() {
        const users = await DataHelper.getUsers();
        const recDeleteUsers = async (usrs) => {
            const user = usrs.shift();
            if (user) {
                if (!user.username.startsWith(AuthData.username)) {
                    await APIHelper.request({
                        method: 'delete',
                        url: `/api/users/${user.id}`
                    });
                    await recDeleteUsers(usrs);
                }
                await recDeleteUsers(usrs);
            }
        };
        await recDeleteUsers(users);
    },

    // delete all users but self
    async deleteOtherUsers() {
        const users = await DataHelper.getUsers();
        const recDeleteUsers = async (usrs) => {
            const user = usrs.shift();
            if (user) {
                if (user.id !== DataHelper.selfUserId) {
                    await APIHelper.request({
                        method: 'delete',
                        url: `/api/users/${user.id}`
                    });
                    await recDeleteUsers(usrs);
                }
                await recDeleteUsers(usrs);
            }
        };
        await recDeleteUsers(users);
    },

    // gets dayoff types
    async getDayoffTypes(enabled = null, displayed = null) {
        const params = [];
        if (enabled !== null) {
            params.push(`enabled=${enabled ? 'true' : 'false'}`);
        }
        if (displayed !== null) {
            params.push(`displayed=${displayed ? 'true' : 'false'}`);
        }
        const response = await APIHelper.request({
            method: 'get',
            url: `/api/daysoff/types?${params.join('&')}`
        });
        return response.data.dayoffTypes;
    }

};

module.exports = DataHelper;
