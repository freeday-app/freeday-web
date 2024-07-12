import { Intent } from '@blueprintjs/core';
import DayJS from 'dayjs';
import QS from 'query-string';

import API from './api';
import Lang from './language';
import Toaster from './toaster';
import Tools from './tools';
import Validator from './validator';

const DashboardUtils = {

    // chargement données pour pages absences
    async init(component) {
        try {
            // données absences
            const { filter } = component.state;
            const daysoff = await DashboardUtils.getDaysoff(filter);
            const slackUsers = await DashboardUtils.getSlackUsers();
            const numberDaysoff = Object.keys(daysoff).length;
            const numberSlackUsers = Object.keys(slackUsers).length;

            const answer = {
                filter,
                daysoff,
                numberDaysoff,
                numberSlackUsers
            };

            // callback composant
            component.handleInit(answer);
        } catch (err) {
            console.error(err);
            Toaster.show({
                message: err.message,
                intent: Intent.DANGER
            });
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
            if ((
                Array.isArray(data[name]) && data[name].length
            ) || (
                data[name] !== null
            )) {
                filter[name] = data[name];
            }
        });
        return QS.stringify(filter, {
            arrayFormat: 'bracket'
        });
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
        return Object.keys(daysoff).map((dayoffId) => {
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
    },

    //
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

    // récupère données absences avec filtre
    async getDaysoff(filterData = {}) {
        try {
            const processedFilter = DashboardUtils.processFilter(filterData);
            const daysoffById = {};
            if (Validator.validateFilter(processedFilter)) {
                const URLArgs = DashboardUtils.getFilterURLArgs(processedFilter);
                console.log(URLArgs);
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
    }
};

export default DashboardUtils;
