import { Intent } from '@blueprintjs/core';
import QS from 'query-string';
import DayJS from 'dayjs';

import API from './api.js';
import Lang from './language.js';
import Toaster, { ToasterTimeout } from './toaster.js';
import Tools from './tools.js';
import Validator from './validator.js';

const DayoffPage = {

    // chargement données pour pages absences
    async init(component) {
        try {
            // données users slack
            const slackUsers = await DayoffPage.getSlackUsers();
            // données types d'absence
            const dayoffTypes = await DayoffPage.getDayoffTypes(null, true);
            const enabledDayoffTypes = dayoffTypes.filter((dt) => dt.enabled);
            // données absences
            const daysoff = await DayoffPage.getDaysoff(component.state.filter);
            // callback composant
            component.handleInit({
                daysoff,
                dayoffTypes,
                enabledDayoffTypes,
                slackUsers
            });
        } catch (err) {
            console.error(err);
            Toaster.show({
                message: err.message,
                intent: Intent.DANGER
            });
        }
    },

    // récupère données absences avec filtre
    async getDaysoff(filterData = {}) {
        try {
            const processedFilter = DayoffPage.processFilter(filterData);
            const daysoffById = {};
            if (Validator.validateFilter(processedFilter)) {
                const URLArgs = DayoffPage.getFilterURLArgs(processedFilter);
                const result = await API.call({
                    method: 'GET',
                    url: `/api/daysoff?page=all&order=asc&${URLArgs}`
                });
                result.daysoff.forEach((dayoff) => {
                    daysoffById[dayoff.id] = dayoff;
                });
            }
            return daysoffById;
        } catch (err) {
            console.error(err.message);
            throw new Error(Lang.text('dayoff.error.list'));
        }
    },

    // récupère types d'absences
    async getDayoffTypes(enabled = null, displayed = null) {
        try {
            const params = ['page=all'];
            if (enabled !== null) {
                params.push(`enabled=${enabled ? 'true' : 'false'}`);
            }
            if (displayed !== null) {
                params.push(`displayed=${displayed ? 'true' : 'false'}`);
            }
            const result = await API.call({
                method: 'GET',
                url: `/api/daysoff/types?${params.join('&')}`
            });
            return result.dayoffTypes;
        } catch (err) {
            console.error(err.message);
            throw new Error(Lang.text('dayoff.error.dayoffTypes'));
        }
    },

    // récupère données d'une absence
    async getDayoff(dayoffId) {
        try {
            return await API.call({
                method: 'GET',
                url: `/api/daysoff/${dayoffId}`
            });
        } catch (err) {
            console.error(err.message);
            throw new Error(Lang.text('dayoff.error.get'));
        }
    },

    async getSlackUsers() {
        try {
            // récupère liste users slack
            const result = await API.call({
                method: 'GET',
                url: '/api/slack/users?page=all&deleted=false'
            });
            return result.slackUsers;
        } catch (err) {
            console.error(err.message);
            throw new Error(Lang.text('dayoff.error.slackUsers'));
        }
    },

    // renvoie données filtre traitées pour requête absences
    processFilter(data) {
        const keyControl = {
            start: true,
            end: true,
            type: true,
            slackUser: true,
            status: true
        };
        const processed = {};
        Object.keys(data).forEach((key) => {
            if (keyControl[key]) {
                processed[key] = data[key];
            }
        });
        if (data.all && Object.hasOwnProperty.call(processed, 'slackUser')) {
            delete processed.slackUser;
        }
        if (data.month && data.year) {
            const monthDate = DayJS(`${data.year}/${data.month}`, 'YYYY/M');
            processed.start = monthDate.startOf('month').format('YYYY-MM-DD');
            processed.end = monthDate.endOf('month').format('YYYY-MM-DD');
        }
        return processed;
    },

    // renvoie données filtre parsées en paramètres url
    getFilterURLArgs(data) {
        const filter = {};
        Object.keys(data).forEach((name) => {
            if (Array.isArray(data[name])) {
                if (data[name].length > 0) {
                    filter[name] = data[name].join(',');
                }
            } else if (data[name] !== null) {
                filter[name] = data[name];
            }
        });
        return QS.stringify(filter);
    },

    // update données filtre avec valeur changée dans input
    updateFilter(data, type, name, val, controlData = null) {
        let filterData = data;
        // parse valeur input changé
        let value;
        switch (type) {
            case 'date':
                value = val !== null ? DayJS(val).format('YYYY-MM-DD') : null;
                break;
            case 'select':
                if (val === 'increase' || val === 'decrease') {
                    value = parseInt(filterData[name], 10) + (val === 'increase' ? 1 : -1);
                } else {
                    value = val !== null ? val.value : null;
                }
                break;
            case 'selectMultiple':
                value = val ? val.map((v) => v.value) : [];
                break;
            case 'switch':
                value = val;
                break;
            case 'number':
                value = parseInt(val, 10);
                break;
            default:
                return false;
        }
        filterData[name] = value;
        if (controlData) {
            filterData = controlData(filterData);
        }
        return filterData;
    },

    // effectue une action sur une absence (confirmation, annulation, reset)
    async dayoffAction(id, action, data = null, throwConflict = false) {
        try {
            const result = await API.call({
                method: 'PUT',
                url: `/api/daysoff/${id}/${action}`,
                data
            });
            if (result.code) {
                let warningMessage = null;
                switch (result.code) {
                    case 2060:
                        warningMessage = 'dayoff.warning.notifyReferrer';
                        break;
                    case 2061:
                        warningMessage = 'dayoff.warning.notifyUser';
                        break;
                    default:
                        console.error(result);
                }
                if (warningMessage) {
                    Toaster.show({
                        message: Lang.text(warningMessage),
                        intent: Intent.WARNING,
                        timeout: ToasterTimeout.LONG
                    });
                }
            }
            return result;
        } catch (err) {
            if (throwConflict && err.code === 4090) {
                throw err;
            } else {
                console.error(err);
                Toaster.show({
                    message: Lang.text('dayoff.error.action'),
                    intent: Intent.DANGER
                });
            }
        }
        return null;
    },

    // parse / formatte données absences pour affichage et export csv
    parseDaysoffForDisplay(daysoff) {
        const parseDate = (date, period, full = false) => {
            const dateString = DayJS(date).format(Lang.text(`date.format${full ? 'Full' : ''}`, false));
            const periodString = period !== null ? Lang.text(`period${full ? '' : '.short'}.${period}`) : '';
            return Tools.ucfirst(`${dateString} ${periodString}`.toLowerCase());
        };
        const parseStatus = (d) => {
            if (d.confirmed) { return 'confirmed'; }
            if (d.canceled) { return 'canceled'; }
            return 'pending';
        };
        const parsed = Object.keys(daysoff).map((dayoffId) => {
            const dayoff = daysoff[dayoffId];
            return {
                id: dayoff.id,
                name: dayoff.slackUser.name,
                avatar: dayoff.slackUser.avatar,
                type: dayoff.type.name,
                emoji: dayoff.type.emoji,
                important: dayoff.type.important,
                start: parseDate(dayoff.start, dayoff.startPeriod),
                startFull: parseDate(dayoff.start, dayoff.startPeriod, true),
                end: parseDate(dayoff.end, dayoff.endPeriod),
                endFull: parseDate(dayoff.end, dayoff.endPeriod, true),
                count: dayoff.count,
                status: parseStatus(dayoff),
                comment: dayoff.comment,
                cancelReason: dayoff.cancelReason
            };
        });
        return parsed;
    }

};

export default DayoffPage;
