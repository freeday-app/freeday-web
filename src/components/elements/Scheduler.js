import React, { Component } from 'react';
import { Tooltip, Position } from '@blueprintjs/core';
import DayJS from 'dayjs';

import DayoffDate from '../../utils/dayoffDate.js';
import Lang from '../../utils/language.js';

import DayoffMenu from './dayoff/DayoffMenu.js';

import '../../css/elements/scheduler.css';

import Configuration from '../../utils/configuration.js';

class Scheduler extends Component {
    // parse et renvoie données ressources et events
    getParsedData(dayList) {
        const {
            ressources,
            events,
            all
        } = this.props;
        const parsed = {};
        const dayListObj = {};
        dayList.forEach((day) => {
            dayListObj[day] = null;
        });
        ressources.forEach((ressource) => {
            if (!Object.hasOwnProperty.call(parsed, ressource.id)) {
                parsed[ressource.id] = {
                    ...ressource,
                    empty: true,
                    days: {
                        ...dayListObj
                    }
                };
            }
        });
        events.forEach((event) => {
            const startDate = DayJS(event.start).format('YYYY-MM-DD');
            const endDate = DayJS(event.end).format('YYYY-MM-DD');
            event.days.forEach((date) => {
                const dateFormatUs = DayJS(date).format('YYYY-MM-DD');
                if (
                    Object.hasOwnProperty.call(parsed, event.ressource)
                    && Object.hasOwnProperty.call(parsed[event.ressource].days, dateFormatUs)
                ) {
                    // initialize object for that day if needed
                    if (!parsed[event.ressource].days[dateFormatUs]) {
                        parsed[event.ressource].days[dateFormatUs] = {};
                    }

                    // determine what part of the day that specific event occupies
                    const periods = [];
                    if (dateFormatUs === startDate) {
                        if (event.startPeriod === 'pm') {
                            periods.push('pm');
                        } else if (event.startPeriod === 'am' && event.count < 1) {
                            periods.push('am');
                        } else {
                            periods.push('am');
                            periods.push('pm');
                        }
                    } else if (dateFormatUs === endDate) {
                        if (event.endPeriod === 'am') {
                            periods.push('am');
                        } else if (event.startPeriod === 'pm' && event.count < 1) {
                            periods.push('pm');
                        } else {
                            periods.push('am');
                            periods.push('pm');
                        }
                    } else {
                        periods.push('am');
                        periods.push('pm');
                    }

                    // register an event for a part of the day
                    // non canceled daysoff have priority over canceled daysoff
                    for (const period of periods) {
                        if (
                            !parsed[event.ressource].days[dateFormatUs][period]
                            || !event.canceled
                        ) {
                            parsed[event.ressource].days[dateFormatUs][period] = event;
                            parsed[event.ressource].empty = false;
                        }
                    }
                }
            });
        });
        if (!all) {
            Object.keys(parsed).forEach((ressourceId) => {
                if (parsed[ressourceId].empty) {
                    delete parsed[ressourceId];
                }
            });
        }
        return parsed;
    }

    renderDayEvents(events) {
        const { onRefresh } = this.props;
        // if both periods of the day concern the same event we render a full circle
        if (events.am && events.pm && events.am.dayoffId === events.pm.dayoffId) {
            return (
                <Tooltip
                    content={events.am.text}
                    position={Position.BOTTOM}
                >
                    <DayoffMenu
                        dayoffId={events.am.dayoffId}
                        onRefresh={onRefresh}
                        exclude={['edit']}
                    >
                        <div
                            className={
                                `scheduler-table-body-event clickable scheduler-table-${events.am.color}`
                            }
                            data-dayoffid={
                                events.am.dayoffId
                            }
                        />
                    </DayoffMenu>
                </Tooltip>
            );
        }
        // else we render half circles for the different daysoff
        // if both half of the circle are the same color we split it with css borders
        const splitClass = events.am && events.pm && events.am.color === events.pm.color ? ' split' : '';
        return ['am', 'pm'].map((period) => (
            events[period] ? (
                <Tooltip
                    key={period}
                    content={events[period].text}
                    position={Position.BOTTOM}
                >
                    <DayoffMenu
                        dayoffId={events[period].dayoffId}
                        onRefresh={onRefresh}
                        exclude={['edit']}
                    >
                        <div
                            className={
                                `scheduler-table-body-half-event clickable scheduler-table-${events[period].color} ${period}${splitClass}`
                            }
                            data-dayoffid={
                                events[period].dayoffId
                            }
                        />
                    </DayoffMenu>
                </Tooltip>
            ) : (
                <span className="scheduler-table-body-half-event-wrapper" key={period}>
                    <div className="scheduler-table-body-half-event" />
                </span>
            )
        ));
    }

    render() {
        const {
            month,
            year
        } = this.props;
        const todayDateUs = DayJS().format('YYYY-MM-DD');

        const monthDate = DayJS(`${month}/${year}`, 'M/YYYY');
        const startDate = monthDate.startOf('month').toDate();
        const endDate = monthDate.endOf('month').toDate();

        const dayList = DayoffDate.getDayList(startDate, endDate, 'YYYY-MM-DD');
        const monthList = DayoffDate.getDayListMonths(dayList);

        const holidayList = DayoffDate.getHolidays(year, 'YYYY-MM-DD');
        const holidayObj = {};
        holidayList.forEach((date) => {
            holidayObj[date] = true;
        });

        const parsedData = this.getParsedData(dayList);
        const atLeastOneDayoff = Object.keys(parsedData).length > 0;

        const isWorkDay = (dayOfTheWeek) => (
            Configuration.data.workDays.includes(dayOfTheWeek)
        );

        return (
            <div className="scheduler">
                <table className="scheduler-table">
                    { /* entête */ }
                    <thead className="scheduler-table-head-fixed">
                        { /* entête supérieure mois */ }
                        <tr className="scheduler-table-head-months">
                            <th className="scheduler-table-head-empty" rowSpan="2">{}</th>
                            {
                                monthList.map((m) => (
                                    <th className="scheduler-table-head-month" key={`month-${m.number}`} colSpan={m.count}>
                                        {m.text}
                                    </th>
                                ))
                            }
                        </tr>
                        { /* entête inférieure jours */ }
                        <tr className="scheduler-table-head-days">
                            {
                                dayList.map((day) => {
                                    const dayDate = DayJS(day);
                                    const dayUs = dayDate.format('YYYY-MM-DD');
                                    const dayNumber = dayDate.date();
                                    let thClass = 'scheduler-table-head-day';
                                    if (todayDateUs === dayUs) {
                                        thClass += atLeastOneDayoff ? ' today' : ' today solo';
                                    }
                                    return (
                                        <th className={thClass} key={`day-${dayNumber}`}>{dayNumber}</th>
                                    );
                                })
                            }
                        </tr>
                    </thead>
                    { /* contenu */ }
                    <tbody>
                        {
                            atLeastOneDayoff ? Object.keys(parsedData).map((ressourceId) => {
                                const ressource = parsedData[ressourceId];
                                return (
                                    <tr key={`ressource-${ressourceId}`}>
                                        { /* nom ressource */ }
                                        {/* <td className="summary-table-name not-fixed"> */}
                                        <td className="scheduler-table-body-ressource" key={`ressource-${ressourceId}-name`}>
                                            <div className="avatar">
                                                <img src={ressource.avatar} alt="avatar" />
                                            </div>
                                            {ressource.name}
                                        </td>
                                        { /* jours ressource */
                                            Object.keys(ressource.days).map((day) => {
                                                const events = ressource.days[day];
                                                const dayOfTheWeek = DayJS(day).day();
                                                let eventClass = 'scheduler-table-body-day';
                                                // classe grise pour week ends et jours fériés
                                                if (
                                                    !isWorkDay(dayOfTheWeek)
                                                    || holidayObj[day]
                                                ) {
                                                    eventClass += ' scheduler-table-holiday';
                                                }
                                                // classe pour highlight date d'aujourd'hui
                                                if (todayDateUs === day) {
                                                    eventClass += ' today';
                                                }
                                                // affichage cellule
                                                return (
                                                    <td className={eventClass} key={`ressource-${ressourceId}-event-${day}`}>
                                                        { events
                                                            ? this.renderDayEvents(events)
                                                            : null }
                                                    </td>
                                                );
                                            })
                                        }
                                    </tr>
                                );
                            }) : (
                                <tr className="no-hover">
                                    <td colSpan={dayList.length + 1}>
                                        <i>{Lang.text('dayoff.noData')}</i>
                                    </td>
                                </tr>
                            )
                        }
                    </tbody>
                </table>
            </div>
        );
    }
}

export default Scheduler;
