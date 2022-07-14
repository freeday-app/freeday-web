import React, { Component } from 'react';
import {
    Tabs,
    Tab,
    Icon,
    H4
} from '@blueprintjs/core';

import DayoffTypes from './ConfigDayoffTypes';
import Settings from './ConfigSettings';
import Admins from './ConfigAdmins';
import Lang from '../../utils/language';

import '../../css/pages/config.css';

class ConfigPage extends Component {
    tabContent = (name, icon) => (
        <>
            <Icon className="tab-icon" icon={icon} />
            <span className="tab-text">
                {Lang.text(`nav.${name}`)}
            </span>
        </>
    );

    getSelectedTabId = () => {
        const { content } = this.props;
        return content;
    };

    handleTabChange = (tabId) => {
        const { history } = this.props;
        history.push(`/config/${tabId}`);
    };

    subnav = () => (
        <div className="config-header">
            <H4 className="center">
                <Icon className="tab-icon" icon="cog" iconSize={20} />
                <span>{Lang.text('nav.config')}</span>
            </H4>
            <Tabs id="config-tabs" className="tabs" onChange={this.handleTabChange} selectedTabId={this.getSelectedTabId()}>
                <Tab id="settings" title={this.tabContent('settings', 'settings')} />
                <Tab id="admins" title={this.tabContent('admins', 'people')} />
                <Tab id="types" title={this.tabContent('types', 'manually-entered-data')} />
            </Tabs>
        </div>
    );

    content = () => {
        const { content } = this.props;
        switch (content) {
            case 'settings':
                return <Settings />;
            case 'admins':
                return <Admins />;
            case 'types':
                return <DayoffTypes />;
            default:
                return null;
        }
    };

    render() {
        return (
            <div id="content" className="content">
                <div id="config" className="content-col config">
                    <div id="config-top" className="content-layout-top config-top">
                        {this.subnav()}
                    </div>
                    <div id="config-main" className="content-layout-main config-main">
                        {this.content()}
                    </div>
                </div>
            </div>
        );
    }
}

export default ConfigPage;
