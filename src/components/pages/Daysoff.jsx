import React, { Component } from 'react';
import { Intent } from '@blueprintjs/core';
import DayJS from 'dayjs';

import DayoffFormDialog from '../elements/dayoff/DayoffForm';
import Loading from '../elements/Loading';
import Filter from '../elements/Filter';
import DayoffList from '../elements/dayoff/DayoffList';
import SideButtons from '../elements/dayoff/SideButtons';

import DayoffPage from '../../utils/dayoffPage';
import Tools from '../../utils/tools';
import Toaster from '../../utils/toaster';
import Validator from '../../utils/validator';

import '../../css/pages/dayoff.css';
import '../../css/elements/filter.css';

class Daysoff extends Component {
    constructor(props) {
        super(props);
        const defaultFilter = {
            start: DayJS().startOf('month').format('YYYY-MM-DD'),
            end: DayJS().endOf('month').format('YYYY-MM-DD'),
            slackUser: [],
            type: null,
            status: null
        };
        const filter = Tools.getLocalStorageObject('dayoffFilter', {
            ...defaultFilter
        });
        this.state = {
            loading: true,
            slackUsers: [],
            dayoffTypes: [],
            enabledDayoffTypes: [],
            filter,
            defaultFilter,
            daysoff: {},
            formDialog: false,
            dayoffId: null
        };
    }

    componentDidMount() {
    // chargement données page
        DayoffPage.init(this);
    }

    // eslint-disable-next-line react/no-unused-class-component-methods
    handleInit = (data) => {
        this.setState({
            loading: false,
            ...data
        });
    };

    updateState = (newState) => {
        this.setState(newState);
    };

    // refresh les données de la page
    refresh = async () => {
        const { filter } = this.state;
        const daysoffById = await DayoffPage.getDaysoff(filter);
        this.setState({
            daysoff: daysoffById
        });
    };

    // gère changements filtre
    handleFilter = async (type, name, value) => {
        try {
            const { filter } = this.state;
            // update filtre
            const filterData = DayoffPage.updateFilter(filter, type, name, value);
            this.setState({
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

    // gère ouverture popup
    handleFormOpen = (dayoffId) => {
        this.setState({
            dayoffId,
            formDialog: true
        });
    };

    // gère fermeture de popup
    // handleFormClose = () => {
    //     this.setState({
    //         formDialog: false,
    //         dayoffId: null
    //     });
    // };

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

    // sauvegarde données filtres dans localStorage
    saveFilter(filterData = null) {
        const { filter } = this.state;
        Tools.setLocalStorageObject(
            'dayoffFilter',
            filterData || filter
        );
    }

    // rendu page
    render() {
        const {
            loading,
            daysoff,
            formDialog,
            slackUsers,
            dayoffTypes,
            enabledDayoffTypes,
            filter,
            dayoffId
        } = this.state;
        const {
            language
        } = this.props;
        if (loading) {
        // rendu chargement page
            return (
                <div id="content">
                    <Loading />
                </div>
            );
        }
        const parsedDaysoff = DayoffPage.parseDaysoffForDisplay(daysoff);
        return (
            <div id="content" className="content">
                <div id="dayoff" className="content-col dayoff">
                    <div id="dayoff-top" className="content-layout-top dayoff-top">
                        <Filter
                            language={language}
                            fields={['start', 'end', 'slackUser', 'type', 'status', 'reset']}
                            data={filter}
                            slackUsers={slackUsers}
                            dayoffTypes={dayoffTypes}
                            onChange={this.handleFilter}
                            onReset={this.resetFilter}
                            prefix="dayoff"
                            inline
                        />
                    </div>
                    <div id="dayoff-main" className="content-layout-main dayoff-main">
                        <div className="content-layout-main-scroll expand">
                            <DayoffList
                                daysoff={parsedDaysoff}
                                onEdit={this.handleFormOpen}
                                onRefresh={this.refresh}
                            />
                        </div>
                    </div>
                    <div id="dayoff-bottom" className="content-layout-top dayoff-bottom">
                        <SideButtons
                            handleParentState={this.updateState}
                            parsedDaysoff={parsedDaysoff}
                        />
                        <DayoffFormDialog
                            isOpen={formDialog}
                            handleParentState={this.updateState}
                            slackUsers={slackUsers}
                            dayoffTypes={enabledDayoffTypes}
                            filter={filter}
                            dayoffId={dayoffId}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

export default Daysoff;
