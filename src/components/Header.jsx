import React, { useState } from 'react';
import {
    Link,
    useNavigate,
    useLocation
} from 'react-router-dom';
import {
    Menu,
    MenuItem,
    MenuDivider,
    Navbar,
    NavbarDivider,
    NavbarGroup,
    NavbarHeading,
    Position,
    Intent,
    Tabs,
    Tab,
    Icon
} from '@blueprintjs/core';
import { Popover2 } from '@blueprintjs/popover2';

import API from '../utils/api';
import Toaster from '../utils/toaster';
import Lang from '../utils/language';
import Tools from '../utils/tools';
import SupportDialog from './elements/SupportDialog';
import ConfigurationContext from './elements/ConfigurationContext';
import Emoji from './elements/Emoji';

import '../css/header.css';

const Header = ({ onLanguage, onTheme }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const [isSupportDialogOpen, setIsSupportDialogOpen] = useState(false);

    // handles logout
    const handleLogout = async () => {
        try {
            await API.call({
                method: 'DELETE',
                url: '/api/auth'
            });
            API.unsetAuth();
            navigate('/');
        } catch (err) {
            console.error(err);
            API.unsetAuth();
            navigate('/');
        }
        for (const filter of ['dayoffFilter', 'scheduleFilter', 'summaryFilter']) {
            Tools.removeLocalStorageObject(filter);
        }
    };

    // handles language change
    const handleLanguage = async (code) => {
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
    const handleTheme = async (theme) => {
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

    // handles config menu links to config pages
    const handleConfigLink = (path) => {
        navigate(path);
    };

    // handle link on the menu to open the support panel dialog
    const handleTriggerSupportDialog = () => {
        setIsSupportDialogOpen((previous) => !previous);
    };

    // configuration submenu
    const configMenu = () => (
        <Menu id="nav-config">
            {/* general settings */}
            <MenuItem
                text={Lang.text('nav.settings')}
                icon="settings"
                onClick={() => handleConfigLink('/config/settings')}
            />
            {/* administrators */}
            <MenuItem
                text={Lang.text('nav.admins')}
                icon="people"
                onClick={() => handleConfigLink('/config/admins')}
            />
            {/* dayoff types */}
            <MenuItem
                text={Lang.text('nav.types')}
                icon="manually-entered-data"
                onClick={() => handleConfigLink('/config/types')}
            />
            <MenuDivider />
            {/* language */}
            <MenuItem
                text={Lang.text('nav.language')}
                icon="translate"
            >
                {Lang.list().map((lang) => (
                    <MenuItem
                        key={lang.code}
                        text={lang.name}
                        onClick={() => handleLanguage(lang.code)}
                    />
                ))}
            </MenuItem>
            {/* theme menu */}
            <MenuItem
                text={Lang.text('nav.theme')}
                icon="contrast"
            >
                <MenuItem
                    key="light"
                    text={Lang.text('theme.light')}
                    icon="flash"
                    onClick={() => handleTheme('light')}
                />
                <MenuItem
                    key="dark"
                    text={Lang.text('theme.dark')}
                    icon="moon"
                    onClick={() => handleTheme('dark')}
                />
            </MenuItem>
            <MenuDivider />
            {/* Support dialog */}
            <MenuItem
                text={Lang.text('nav.support')}
                icon="book"
                onClick={handleTriggerSupportDialog}
            />
            {/* logout */}
            <MenuItem
                text={Lang.text('nav.logout')}
                icon="log-out"
                onClick={handleLogout}
            />
        </Menu>
    );

    // tabs items content
    const tabContent = (name, icon) => (
        <>
            <Icon className="tab-icon" icon={icon} iconSize={16} />
            <span className="tab-text">{Lang.text(`nav.${name}`)}</span>
        </>
    );

    // configuration nav tab
    const configTab = () => (
        <Popover2
            position={Position.BOTTOM}
            content={configMenu()}
        >
            {tabContent('config', 'cog')}
        </Popover2>
    );

    // tabs items navigation link
    const tabLink = (name, icon) => (
        <Link to={`/${name}`}>{tabContent(name, icon)}</Link>
    );

    // gets selected tab id from current url
    const getCurrentSelectedTab = () => {
        const navData = {
            '/daysoff': 'daysoff',
            '/schedule': 'schedule',
            '/summary': 'summary',
            '/config/settings': 'config',
            '/config/types': 'config',
            '/config/admins': 'config'
        };
        const { pathname } = location;
        if (navData[pathname]) {
            return navData[pathname];
        }
        return null;
    };

    return (
        <ConfigurationContext.Consumer>
            {({ configuration }) => (
                <>
                    <Navbar id="nav">
                        <NavbarGroup className="nav-group">
                            <NavbarHeading className="nav-heading">
                                <div className="nav-logo">
                                    {
                                        configuration && configuration.brandingLogo
                                            ? <img src={configuration.brandingLogo} alt="brandingLogo" />
                                            : <Emoji emoji="palm_tree" size={20} />
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
                                selectedTabId={getCurrentSelectedTab()}
                            >
                                {/* pages tabs */}
                                <Tab
                                    id="daysoff"
                                    className="nav-tab"
                                    title={tabLink('daysoff', 'calendar')}
                                />
                                <Tab
                                    id="schedule"
                                    className="nav-tab"
                                    title={tabLink('schedule', 'gantt-chart')}
                                />
                                <Tab
                                    id="summary"
                                    className="nav-tab"
                                    title={tabLink('summary', 'th-list')}
                                />
                                <Tabs.Expander />
                                {/* configuration */}
                                <Tab
                                    id="config"
                                    className="nav-tab"
                                    title={configTab()}
                                />
                            </Tabs>
                        </NavbarGroup>
                    </Navbar>
                    <SupportDialog
                        isOpen={isSupportDialogOpen}
                        onClose={handleTriggerSupportDialog}
                    />
                </>
            )}
        </ConfigurationContext.Consumer>
    );
};

export default Header;
