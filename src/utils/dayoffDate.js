import DayJS from 'dayjs';

import API from './api';
import Lang from './language';

const DayoffDate = {

    // renvoie liste des jours entre deux dates
    getDayList(startDate, endDate, format = false) {
        const days = [];
        let date = startDate;
        const end = endDate;
        while (end.getTime() >= date.getTime()) {
            if (format) {
                days.push(DayJS(date).format(format));
            } else {
                days.push(date);
            }
            date = DayJS(date).add(1, 'days').toDate();
        }
        return days;
    },

    // renvoie array données des mois couvrant la liste de dates
    getDayListMonths(dayList) {
        const months = [];
        dayList.forEach((day) => {
            const monthNumber = DayJS(day).month() + 1;
            if (!months[monthNumber]) {
                months[monthNumber] = {
                    number: monthNumber,
                    text: Lang.text(`month.${monthNumber}`),
                    count: 1
                };
            } else {
                months[monthNumber].count += 1;
            }
        });
        return Object.values(months);
    },

    // renvoie array valeurs mois de l'année pour select
    getMonthValues() {
        const monthValues = [];
        const months = Lang.data('month');
        Object.keys(months).forEach((monthNumber) => {
            monthValues.push({
                value: monthNumber,
                label: months[monthNumber]
            });
        });
        return monthValues;
    },

    // renvoie valeur mois de l'année pour select
    getMonthValue(value) {
        const monthValues = DayoffDate.getMonthValues();
        for (const val of monthValues) {
            if (parseInt(val.value, 10) === parseInt(value, 10)) {
                return val;
            }
        }
        return null;
    },

    // renvoie valeur mois en cours pour select
    getCurrentMonthValue() {
        const months = DayoffDate.getMonthValues();
        return months[DayJS().month()];
    },

    // renvoie la liste des années concernées par la période donnée
    getYearsOfPeriod(start, end) {
        const startYear = DayJS(start).year();
        const endYear = DayJS(end).year();
        const years = [];
        for (let y = startYear; y <= endYear; y += 1) {
            years.push(y);
        }
        return years;
    },

    // renvoie liste des dates fériés année ciblée
    async getHolidays(year, format = false) {
        const holidayList = await API.call(
            {
                method: 'GET',
                url: `/api/daysoff/holidays/${year}`
            }
        );

        if (format) {
            return holidayList.map((holiday) => DayJS(holiday).format(format));
        }
        return holidayList.map((holiday) => holiday.toDate());
    },

    // renvoie le nombre de jours travaillés sur une liste de jours
    getWorkDays(startDate, endDate, dList = null) {
        let dayList = dList;
        if (!dayList) {
            dayList = DayoffDate.getDayList(startDate, endDate, 'YYYY-MM-DD');
        }
        // liste des jours fériés
        const years = DayoffDate.getYearsOfPeriod(startDate, endDate);
        const holidayList = DayoffDate.getHolidays(years, 'YYYY-MM-DD');
        const holidayObj = {};
        holidayList.forEach((date) => {
            holidayObj[date] = true;
        });
        // compte de jours travaillés dans le mois
        return dayList.filter((day) => {
            const dayOfTheWeek = DayJS(day).day();
            return dayOfTheWeek !== 6 && dayOfTheWeek !== 0 && !holidayObj[day];
        }).length;
    }

};

export default DayoffDate;
