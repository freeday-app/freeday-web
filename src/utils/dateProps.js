import { Position } from '@blueprintjs/core';
import DayJS from 'dayjs';

import Lang from './language.js';
import Tools from './tools.js';

function getMonthList() {
    return Object.values(Lang.data('month')).map((m) => Tools.ucfirst(m));
}

function getDayList() {
    // déplace
    const dayList = Object.values(Lang.data('day')).map((d) => Tools.ucfirst(d));
    dayList.unshift(dayList.pop());
    return dayList;
}

function getDayShortList() {
    return getDayList().map((day) => day.substr(0, 2));
}

export default () => ({
    minDate: DayJS().subtract(5, 'years').startOf('year').toDate(),
    maxDate: DayJS().add(5, 'years').endOf('year').toDate(),
    dayPickerProps: {
        months: getMonthList(),
        weekdaysLong: getDayList(),
        weekdaysShort: getDayShortList(),
        firstDayOfWeek: Lang.text('date.firstDayOfWeek')
    },
    formatDate: (date) => DayJS(date).format(Lang.text('date.format', false)),
    parseDate: (str) => DayJS(str, Lang.text('date.format', false)).toDate(),
    placeholder: Lang.text('date.format', false),
    popoverProps: {
        position: Position.BOTTOM
    },
    highlightCurrentDay: true,
    showActionsBar: true,
    clearButtonText: Lang.text('button.clear'),
    todayButtonText: Lang.text('button.today')
});
