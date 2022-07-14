import DayJS from 'dayjs';

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
    getHolidays(year, format = false) {
        if (Array.isArray(year)) {
            let holidays = [];
            year.forEach((y) => {
                holidays = holidays.concat(DayoffDate.getHolidays(y, format));
            });
            return holidays;
        }

        const holidays = [
            DayJS(`${year}-1-1`, 'YYYY-M-D'), // jour de l'an
            DayJS(`${year}-5-1`, 'YYYY-M-D'), // fête du travail
            DayJS(`${year}-5-8`, 'YYYY-M-D'), // victoire des alliés
            DayJS(`${year}-7-14`, 'YYYY-M-D'), // fête nationale
            DayJS(`${year}-8-15`, 'YYYY-M-D'), // assomption
            DayJS(`${year}-11-1`, 'YYYY-M-D'), // toussaint
            DayJS(`${year}-11-11`, 'YYYY-M-D'), // armistice
            DayJS(`${year}-12-25`, 'YYYY-M-D') // noël
        ];
        const easter = DayoffDate.getEaster(year);
        holidays.push(easter.add(1, 'days')); // lundi de pâques
        holidays.push(easter.add(39, 'days')); // ascension
        // holidays.push(easter.add(50, 'days')); // lundi de pentecôte

        if (format) {
            return holidays.map((holiday) => holiday.format(format));
        }
        return holidays.map((holiday) => holiday.toDate());
    },

    // renvoie date pâques pour année ciblée
    getEaster(year) {
        const { floor } = Math;
        const G = year % 19;
        const C = floor(year / 100);
        const H = (C - floor(C / 4) - floor((8 * C + 13) / 25) + 19 * G + 15) % 30;
        const I = H - floor(H / 28) * (1 - floor(29 / (H + 1)) * floor((21 - G) / 11));
        const J = (year + floor(year / 4) + I + 2 - C + floor(C / 4)) % 7;
        const L = I - J;
        const month = 3 + floor((L + 40) / 44);
        const day = L + 28 - 31 * floor(month / 4);
        const easter = DayJS(`${year}-${month}-${day}`, 'YYYY-M-D');

        return easter;
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
