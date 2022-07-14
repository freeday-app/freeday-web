import React from 'react';
import { useNavigate } from 'react-router-dom';
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

const ConfigPage = ({ content }) => {
    const navigate = useNavigate();

    const tabContent = (name, icon) => (
        <>
            <Icon className="tab-icon" icon={icon} />
            <span className="tab-text">
                {Lang.text(`nav.${name}`)}
            </span>
        </>
    );

    const handleTabChange = (tabId) => {
        navigate(`/config/${tabId}`);
    };

    const subnav = () => (
        <div className="config-header">
            <H4 className="center">
                <Icon className="tab-icon" icon="cog" iconSize={20} />
                <span>{Lang.text('nav.config')}</span>
            </H4>
            <Tabs id="config-tabs" className="tabs" onChange={handleTabChange} selectedTabId={content}>
                <Tab id="settings" title={tabContent('settings', 'settings')} />
                <Tab id="admins" title={tabContent('admins', 'people')} />
                <Tab id="types" title={tabContent('types', 'manually-entered-data')} />
            </Tabs>
        </div>
    );

    const getContentComponent = () => {
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

    return (
        <div id="content" className="content">
            <div id="config" className="content-col config">
                <div id="config-top" className="content-layout-top config-top">
                    {subnav()}
                </div>
                <div id="config-main" className="content-layout-main config-main">
                    {getContentComponent()}
                </div>
            </div>
        </div>
    );
}

export default ConfigPage;
