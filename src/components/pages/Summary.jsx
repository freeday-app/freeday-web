import React, { Component } from 'react';
import {
    Icon,
    HTMLTable,
    Button,
    Intent,
    Position
} from '@blueprintjs/core';
import { Tooltip2 } from '@blueprintjs/popover2';
import { CSVLink } from 'react-csv';
import DayJS from 'dayjs';

import Loading from '../elements/Loading';
import Filter from '../elements/Filter';

import DayoffPage from '../../utils/dayoffPage';
import DayoffDate from '../../utils/dayoffDate';
import Lang from '../../utils/language';
import Tools, { TruncLength } from '../../utils/tools';
import Toaster from '../../utils/toaster';
import Validator from '../../utils/validator';

import '../../css/pages/summary.css';
import '../../css/elements/filter.css';

class Summary extends Component {
    constructor(props) {
        super(props);
        const defaultFilter = {
            start: DayJS().startOf('month').format('YYYY-MM-DD'),
            end: DayJS().endOf('month').format('YYYY-MM-DD'),
            slackUser: [],
            all: false
        };
        const filter = Tools.getLocalStorageObject('summaryFilter', {
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

    // renvoie données absences traitées pour récapitulatif
    getData() {
        const {
            filter,
            dayoffTypes,
            slackUsers
        } = this.state;
        let data = {};
        const startDate = DayJS(filter.start).toDate();
        const endDate = DayJS(filter.end).toDate();
        // liste jours du mois
        const dayList = DayoffDate.getDayList(startDate, endDate, 'YYYY-MM-DD');
        // compte de jours travaillés dans le mois
        const workDaysCount = DayoffDate.getWorkDays(
            filter.start,
            filter.end,
            dayList
        );
        // insère users dans données parsées
        const typeCount = {};
        for (const dt of dayoffTypes) {
            typeCount[dt.id] = 0;
        }
        slackUsers.forEach((user) => {
            data[user.slackId] = {
                slackId: user.slackId,
                name: user.name,
                avatar: user.avatar,
                workingCount: workDaysCount,
                dayoffCount: 0,
                typeCount: { ...typeCount }
            };
        });
        // insère données absences
        data = this.processDataDaysoff(data, dayList);
        // filtre users
        if (!filter.all) {
            Object.keys(data).forEach((userId) => {
                if (data[userId].dayoffCount === 0) {
                    delete data[userId];
                }
            });
        }
        //
        return data;
    }

    // renvoie données pour export csv
    getCSVData(summaryData) {
        const that = this;
        const { dayoffTypes } = this.state;
        const startFormat = DayJS(that.state.filter.start).format(Lang.text('date.format', false));
        const endFormat = DayJS(that.state.filter.end).format(Lang.text('date.format', false));
        const csvData = [[
            `${startFormat} - ${endFormat}`
        ], [
            '',
            ...dayoffTypes.map((dt) => dt.name),
            Lang.text('summary.column.total'),
            Lang.text('summary.column.workedDays'),
            Lang.text('summary.column.workDays'),
            Lang.text('summary.column.rate')
        ]];
        Object.keys(summaryData).forEach((slackUserId) => {
            const data = summaryData[slackUserId];
            csvData.push([
                data.name,
                ...dayoffTypes.map((dt) => data.typeCount[dt.id]),
                data.dayoffCount,
                data.workingCount - data.dayoffCount,
                data.workingCount,
                Math.round((1 - (data.dayoffCount / data.workingCount)) * 100) / 100
            ]);
        });
        return csvData;
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
        const that = this;
        const {
            filter
        } = this.state;
        try {
        // update filtre
            const filterData = DayoffPage.updateFilter(filter, type, name, value);
            that.setState({
                filter: filterData
            });
            if (Validator.validateFilter(filterData)) {
                this.saveFilter(filterData);
                // update absences
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

    // reset valeurs filtre
    resetFilter = () => {
        const { defaultFilter } = this.state;
        this.setState({
            filter: {
                ...defaultFilter
            }
        });
        this.saveFilter(defaultFilter);
        // update absences
        Tools.spamControl(async () => {
            await this.refresh();
        });
    };

    // refresh données affichées
    async refresh() {
        const { filter } = this.state;
        const daysoffById = await DayoffPage.getDaysoff(filter);
        this.setState({
            daysoff: daysoffById
        });
    }

    // sauvegarde données filtres dans localStorage
    saveFilter(filterData = null) {
        const { filter } = this.state;
        Tools.setLocalStorageObject(
            'summaryFilter',
            filterData || filter
        );
    }

    // calcule et set les valeurs dans les données d'absences
    processDataDaysoff(data, dayList) {
        const { daysoff } = this.state;
        const dayListObj = {};
        dayList.forEach((day) => {
            dayListObj[day] = true;
        });
        // filtre les absences uniquement confirmées
        Object.keys(daysoff).filter((dayoffId) => (
            daysoff[dayoffId].confirmed
        )).forEach((dayoffId) => {
            const dayoff = daysoff[dayoffId];
            if (data[dayoff.slackUser.slackId]) {
                // loop sur jours absence
                dayoff.days.forEach((date) => {
                    const startUs = DayJS(dayoff.start).format('YYYY-MM-DD');
                    const endUs = DayJS(dayoff.end).format('YYYY-MM-DD');
                    const dateUs = DayJS(date).format('YYYY-MM-DD');
                    // si jours est dans le mois
                    if (dayListObj[dateUs]) {
                        // valeur incrémentation
                        let inc = 1;
                        // si demi journée incrémente de 0.5
                        if (
                            (dateUs === startUs && dayoff.startPeriod === 'pm')
                            || (dateUs === endUs && dayoff.endPeriod === 'am')
                        ) {
                            inc = 0.5;
                        }
                        // incrémente compteurs
                        data[dayoff.slackUser.slackId].dayoffCount += inc;
                        if (data[dayoff.slackUser.slackId].typeCount[dayoff.type.id] >= 0) {
                            data[dayoff.slackUser.slackId].typeCount[dayoff.type.id] += inc;
                        }
                    }
                });
            }
        });
        //
        return data;
    }

    // rendu page
    render() {
        const {
            loading,
            filter,
            dayoffTypes,
            slackUsers
        } = this.state;
        const {
            language
        } = this.props;

        if (loading) {
            return (
                <div id="content">
                    <Loading />
                </div>
            );
        }

        // données récapitulatif
        const summaryData = this.getData();
        const summaryKeys = Object.keys(summaryData);

        // rendu final
        return (
            <div id="content" className="content">
                <div id="summary" className="content-col summary">
                    { /* filtre */ }
                    <div className="content-layout-top summary-top">
                        <Filter
                            language={language}
                            fields={['start', 'end', 'slackUser', 'all', 'reset']}
                            data={filter}
                            slackUsers={slackUsers}
                            dayoffTypes={dayoffTypes}
                            onChange={this.handleFilter}
                            onReset={this.resetFilter}
                            prefix="summary"
                            inline
                        />
                    </div>
                    { /* récapitulatif absences */ }
                    <div id="summary-main" className="content-layout-main summary-main">
                        <div className="content-layout-main-scroll">
                            <HTMLTable id="summary-table" className="summary-table" interactive={Object.keys(summaryData).length > 0}>
                                <thead>
                                    <tr>
                                        <th className="not-fixed">{}</th>
                                        {dayoffTypes.map((dt) => (
                                            <th key={dt.id}>
                                                <Tooltip2 content={dt.name || ''} position={Position.BOTTOM}>
                                                    <span className="summary-column-text dayoff-truncated-type">
                                                        {Tools.trunc(dt.name, TruncLength.SHORT)}
                                                    </span>
                                                </Tooltip2>
                                            </th>
                                        ))}
                                        <th>
                                            <span className="summary-column-text">
                                                {Lang.text('summary.column.total')}
                                            </span>
                                        </th>
                                        <th>
                                            <span className="summary-column-text">
                                                {Lang.text('summary.column.workedDays')}
                                            </span>
                                        </th>
                                        <th>
                                            <span className="summary-column-text">
                                                {Lang.text('summary.column.workDays')}
                                            </span>
                                        </th>
                                        <th>
                                            <span className="summary-column-text">
                                                {Lang.text('summary.column.rate')}
                                            </span>
                                            <Tooltip2 content={Lang.text('summary.column.rateHelper')} position={Position.BOTTOM}>
                                                <Icon icon="help" iconSize={15} />
                                            </Tooltip2>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        summaryKeys.length > 0 ? summaryKeys.map((slackUserId) => {
                                            const {
                                                name,
                                                avatar,
                                                typeCount,
                                                dayoffCount,
                                                workingCount
                                            } = summaryData[slackUserId];
                                            return (
                                                <tr key={slackUserId}>
                                                    <td className="summary-table-name not-fixed">
                                                        <div className="avatar">
                                                            <img src={avatar} alt="avatar" />
                                                        </div>
                                                        {name}
                                                    </td>
                                                    {
                                                        dayoffTypes.map((dt) => (
                                                            <td key={dt.id}>
                                                                {typeCount[dt.id]}
                                                            </td>
                                                        ))
                                                    }
                                                    <td>{dayoffCount}</td>
                                                    <td>{workingCount - dayoffCount}</td>
                                                    <td>{workingCount}</td>
                                                    <td>
                                                        {
                                                            dayoffCount
                                                                ? Math.round((
                                                                    1 - (dayoffCount / workingCount)
                                                                ) * 100) / 100
                                                                : 1
                                                        }
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr>
                                                <td colSpan={dayoffTypes.length + 5}>
                                                    <i>{Lang.text('dayoff.noData')}</i>
                                                </td>
                                            </tr>
                                        )
                                    }
                                </tbody>
                            </HTMLTable>
                        </div>
                    </div>
                    { /* boutons action */ }
                    <div className="content-layout-bottom summary-bottom">
                        <div className="summary-buttons">
                            <CSVLink data={this.getCSVData(summaryData)} filename="freeday-csv-export.csv">
                                <Button
                                    className="summary-button"
                                    icon="th"
                                    intent={Intent.PRIMARY}
                                    text={Lang.text('button.csv')}
                                />
                            </CSVLink>
                            <div className="summary-csv-helper">
                                <Tooltip2 content={Lang.text('summary.csvHelper')} position={Position.BOTTOM}>
                                    <Icon icon="help" iconSize={20} />
                                </Tooltip2>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Summary;
