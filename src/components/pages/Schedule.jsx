import React, { Component } from 'react';
import DayJS from 'dayjs';
import { Intent } from '@blueprintjs/core';
import { Emoji } from 'emoji-mart';

import Loading from '../elements/Loading';
import Filter from '../elements/Filter';
import Scheduler from '../elements/Scheduler';

import DayoffPage from '../../utils/dayoffPage';
import Lang from '../../utils/language';
import Tools from '../../utils/tools';
import Toaster from '../../utils/toaster';
import Validator from '../../utils/validator';

import '../../css/elements/filter.css';
import '../../css/pages/schedule.css';

class Schedule extends Component {
    constructor(props) {
        super(props);
        const defaultFilter = {
            month: DayJS().month() + 1,
            year: DayJS().year(),
            slackUser: [],
            all: false
        };
        const filter = Tools.getLocalStorageObject('scheduleFilter', {
            ...defaultFilter
        });
        this.state = {
            loading: true,
            slackUsers: [],
            dayoffTypes: [],
            filter,
            defaultFilter,
            daysoff: {}
        };
    }

    componentDidMount() {
        // chargement données page
        DayoffPage.init(this);
    }

    // renvoie données évènements pour composant scheduler
    getEvents() {
        const { daysoff } = this.state;
        const statusData = {
            confirmed: {
                name: Lang.text('dayoff.status.confirmed'),
                color: 'green'
            },
            pending: {
                name: Lang.text('dayoff.status.pending'),
                color: 'grey'
            },
            canceled: {
                name: Lang.text('dayoff.status.canceled'),
                color: 'red'
            }
        };
        return Object.keys(daysoff)
            .map((dayoffId) => {
                const dayoff = daysoff[dayoffId];
                let statusName = 'pending';
                if (dayoff.confirmed) { statusName = 'confirmed'; }
                if (dayoff.canceled) { statusName = 'canceled'; }
                const text = (
                    <>
                        <div className="scheduler-tooltip">
                            {
                                dayoff.type.emoji
                                    ? <Emoji emoji={dayoff.type.emoji} set="google" size={18} />
                                    : ''
                            }
                            {dayoff.type.name}
                        </div>
                        <div className="schedule-tooltip">
                            {statusData[statusName].name}
                        </div>
                    </>
                );
                const { color } = statusData[statusName];
                return {
                    dayoffId,
                    ressource: dayoff.slackUser.slackId,
                    start: DayJS(dayoff.start).toDate(),
                    startPeriod: dayoff.startPeriod,
                    end: DayJS(dayoff.end).toDate(),
                    endPeriod: dayoff.endPeriod,
                    count: dayoff.count,
                    days: dayoff.days.map((date) => DayJS(date).toDate()),
                    confirmed: dayoff.confirmed,
                    canceled: dayoff.canceled,
                    text,
                    color
                };
            });
    }

    // renvoie données utilisateurs pour composant scheduler
    getRessources() {
        const { slackUsers } = this.state;
        return slackUsers.map((user) => ({
            id: user.slackId,
            name: user.name,
            avatar: user.avatar
        }));
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    handleInit = (data) => {
        this.setState({
            loading: false,
            ...data
        });
    };

    // gère changements filtre
    handleFilter = async (type, name, value) => {
        const { filter } = this.state;
        try {
        // update filtre
            const filterData = DayoffPage.updateFilter(filter, type, name, value, (d) => {
                const data = d;
                if (data.month < 1) {
                    data.month = 12;
                    data.year -= 1;
                } else if (data.month > 12) {
                    data.month = 1;
                    data.year += 1;
                }
                return data;
            });
            this.setState({
                filter: filterData
            });
            if (Validator.validateFilter(filterData)) {
                this.saveFilter(filterData);
                // update données affichées
                Tools.spamControl(async () => {
                    await this.refresh();
                });
            }
        } catch (err) {
            console.error(err);
            Toaster.show({
                message: err.message,
                intent: Intent.DANGER
            });
        }
    };

    // updateState = (newState) => {
    //     this.setState(newState);
    // };

    // refresh les données de la page
    refresh = async () => {
        const { filter } = this.state;
        const daysoffById = await DayoffPage.getDaysoff(filter);
        this.setState({
            daysoff: daysoffById
        });
    };

    // reset valeurs filtre
    resetFilter = () => {
        const { defaultFilter } = this.state;
        this.setState({
            filter: {
                ...defaultFilter
            }
        });
        this.saveFilter(defaultFilter);
        // update données affichées
        Tools.spamControl(async () => {
            await this.refresh();
        });
    };

    // sauvegarde données filtres dans localStorage
    saveFilter(filterData = null) {
        const { filter } = this.state;
        Tools.setLocalStorageObject(
            'scheduleFilter',
            filterData || filter
        );
    }

    // rendu page
    render() {
        const {
            loading,
            language,
            filter,
            slackUsers,
            dayoffTypes
        } = this.state;
        if (loading) {
            return (
                <div id="content">
                    <Loading />
                </div>
            );
        }
        return (
            <div id="content" className="content">
                <div id="schedule" className="content-col schedule">
                    { /* filtre */ }
                    <div id="schedule-top" className="content-layout-top schedule-top">
                        <Filter
                            language={language}
                            fields={['month', 'year', 'slackUser', 'all', 'reset']}
                            data={filter}
                            slackUsers={slackUsers}
                            dayoffTypes={dayoffTypes}
                            onChange={this.handleFilter}
                            onReset={this.resetFilter}
                            prefix="schedule"
                            inline
                        />
                    </div>
                    { /* planning absences */ }
                    <div id="schedule-main" className="content-layout-main schedule-main">
                        <div className="content-layout-main-scroll">
                            <Scheduler
                                language={language}
                                ressources={this.getRessources()}
                                events={this.getEvents()}
                                month={filter.month}
                                year={filter.year}
                                all={filter.all}
                                onRefresh={this.refresh}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Schedule;
