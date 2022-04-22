import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import {
    Menu,
    Navbar,
    NavbarDivider,
    NavbarGroup,
    NavbarHeading,
    Popover,
    Position,
    Intent,
    Tabs,
    Tab,
    Icon
} from '@blueprintjs/core';
import { Emoji } from 'emoji-mart';

// import ReactIcon from './elements/ReactIcon.js';
import API from '../utils/api.js';
import Toaster from '../utils/toaster.js';
import Lang from '../utils/language.js';
import Tools from '../utils/tools.js';
import SupportDialog from './elements/SupportDialog.js';
import ConfigurationContext from './elements/ConfigurationContext.js';

import '../css/header.css';

class Header extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isSupportDialogOpen: false
        };
    }

    // handles logout
    handleLogout = async () => {
        const { history } = this.props;
        try {
            await API.call({
                method: 'DELETE',
                url: '/api/auth'
            });
            API.unsetAuth();
            history.push('/');
        } catch (err) {
            console.error(err);
            API.unsetAuth();
            history.push('/');
        }
        for (const filter of ['dayoffFilter', 'scheduleFilter', 'summaryFilter']) {
            Tools.removeLocalStorageObject(filter);
        }
    };

    // handles language change
    handleLanguage = async (code) => {
        const { onLanguage } = this.props;
        const error = (err = null) => {
            if (err) {
                console.error(err);
            }
            Toaster.show({
                message: Lang.text('app.error.language'),
                intent: Intent.DANGER
            });
        };
        const langCodes = Lang.list().map((language) => language.code);
        if (langCodes.includes(code)) {
            try {
                const user = await API.call({
                    method: 'POST',
                    url: '/api/users/me',
                    data: {
                        language: code
                    }
                });
                Lang.setCurrent(user.language);
                onLanguage(user.language);
            } catch (err) {
                error(err);
            }
        } else {
            error();
        }
    };

    // handles theme change
    handleTheme = async (theme) => {
        const { onTheme } = this.props;
        try {
            const user = await API.call({
                method: 'POST',
                url: '/api/users/me',
                data: {
                    theme
                }
            });
            Tools.setLocalStorageObject('theme', theme);
            onTheme(user.theme);
        } catch (err) {
            console.error(err);
            Toaster.show({
                message: Lang.text('app.error.theme'),
                intent: Intent.DANGER
            });
        }
    };

    // handles slack install link
    // handleSlackInstall = async () => {
    //     try {
    //         // gets oauth data from api
    //         const { url } = await API.call({
    //             method: 'GET',
    //             url: '/api/slack/auth'
    //         });
    //         // redirects to oauth url
    //         window.location.href = url;
    //     } catch (err) {
    //         console.error(err);
    //         Toaster.show({
    //             message: Lang.text('slack.error.getAuth'),
    //             intent: Intent.DANGER
    //         });
    //     }
    // };

    // handles config menu links to config pages
    handleConfigLink = (path) => {
        const { history } = this.props;
        history.push(path);
    };

    // configuration nav tab
    /* Le fix utilisant la prop openOnTargetFocus sur les Menu.Item
    pour empêcher l'ouverture des sous-menus ne semble pas fonctionner
    lorsqu'il y a plus d'un sous-menu.
    On peut utiliser autoFocus={false} sur Popover :
    https://github.com/palantir/blueprint/issues/2863#issuecomment-600879450
    */
    configTab = () => (
        <Popover autoFocus={false} position={Position.BOTTOM} content={this.configMenu()}>
            {this.tabContent('config', 'cog')}
        </Popover>
    );

    // handle link on the menu to open the support panel dialog
    handleTriggerSupportDialog = () => {
        this.setState((prevState) => ({
            isSupportDialogOpen: !prevState.isSupportDialogOpen
        }));
    };

    // configuration submenu
    configMenu = () => (
        <Menu id="nav-config">
            {/* general settings */}
            <Menu.Item
                text={Lang.text('nav.settings')}
                icon="settings"
                onClick={() => this.handleConfigLink('/config/settings')}
            />
            {/* administrators */}
            <Menu.Item
                text={Lang.text('nav.admins')}
                icon="people"
                onClick={() => this.handleConfigLink('/config/admins')}
            />
            {/* dayoff types */}
            <Menu.Item
                text={Lang.text('nav.types')}
                icon="manually-entered-data"
                onClick={() => this.handleConfigLink('/config/types')}
            />
            <Menu.Divider />
            {/* language */}
            <Menu.Item
                text={Lang.text('nav.language')}
                icon="translate"
            >
                {Lang.list().map((lang) => (
                    <Menu.Item
                        key={lang.code}
                        text={lang.name}
                        onClick={() => this.handleLanguage(lang.code)}
                    />
                ))}
            </Menu.Item>
            {/* theme menu */}
            <Menu.Item
                text={Lang.text('nav.theme')}
                icon="contrast"
            >
                <Menu.Item
                    key="light"
                    text={Lang.text('theme.light')}
                    icon="flash"
                    onClick={() => this.handleTheme('light')}
                />
                <Menu.Item
                    key="dark"
                    text={Lang.text('theme.dark')}
                    icon="moon"
                    onClick={() => this.handleTheme('dark')}
                />
            </Menu.Item>
            <Menu.Divider />
            {/* slack oauth button */}
            {/* <Menu.Item
                text={Lang.text('nav.slack')}
                icon={<ReactIcon icon="slack" />}
                onClick={this.handleSlackInstall}
            />
            <Menu.Divider /> */}
            {/* Support dialog */}
            <Menu.Item
                text={Lang.text('nav.support')}
                icon="book"
                onClick={this.handleTriggerSupportDialog}
            />
            {/* logout */}
            <Menu.Item
                text={Lang.text('nav.logout')}
                icon="log-out"
                onClick={this.handleLogout}
            />
        </Menu>
    );

    // tabs items content
    tabContent = (name, icon) => (
        <>
            <Icon className="tab-icon" icon={icon} iconSize={16} />
            <span className="tab-text">{Lang.text(`nav.${name}`)}</span>
        </>
    );

    // tabs items navigation link
    tabLink = (name, icon) => (
        <Link to={`/${name}`}>{this.tabContent(name, icon)}</Link>
    );

    // gets selected tab id from current url
    getSelectedTab = () => {
        const navData = {
            '/daysoff': 'daysoff',
            '/schedule': 'schedule',
            '/summary': 'summary',
            '/config/types': 'config',
            '/config/admins': 'config'
        };
        const { pathname } = window.location;
        if (navData[pathname]) {
            return navData[pathname];
        }
        return null;
    };

    render() {
        const { isSupportDialogOpen } = this.state;
        return (
            <ConfigurationContext.Consumer>
                {({ configuration }) => (
                    <>
                        <Navbar id="nav">
                            <NavbarGroup>
                                <NavbarHeading>
                                    <div className="nav-logo">
                                        {
                                            configuration && configuration.brandingLogo
                                                ? <img src={configuration.brandingLogo} alt="brandingLogo" />
                                                : <Emoji emoji="palm_tree" set="google" size={20} />
                                        }
                                    </div>
                                    <div className="nav-title">
                                        {
                                            `Freeday${
                                                configuration && configuration.brandingName
                                                    ? ` ${configuration.brandingName}`
                                                    : ''
                                            }`
                                        }
                                    </div>
                                </NavbarHeading>
                                <NavbarDivider className="nav-divider" />
                                <Tabs
                                    large
                                    id="nav-tabs"
                                    className="tabs"
                                    selectedTabId={this.getSelectedTab()}
                                >
                                    {/* navigation tabs */}
                                    <Tab id="daysoff" title={this.tabLink('daysoff', 'calendar')} />
                                    <Tab
                                        id="schedule"
                                        title={this.tabLink('schedule', 'gantt-chart')}
                                    />
                                    <Tab id="summary" title={this.tabLink('summary', 'th-list')} />
                                    <Tabs.Expander />
                                    {/* configuration */}
                                    <Tab id="config" title={this.configTab()} />
                                </Tabs>
                            </NavbarGroup>
                        </Navbar>
                        <SupportDialog
                            isOpen={isSupportDialogOpen}
                            onClose={this.handleTriggerSupportDialog}
                        />
                    </>
                )}
            </ConfigurationContext.Consumer>
        );
    }
}

export default Header;
