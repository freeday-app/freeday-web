import DayJS from 'dayjs';
import AdvancedFormat from 'dayjs/plugin/advancedFormat';
import CustomParseFormat from 'dayjs/plugin/customParseFormat';
import React, { Component } from 'react';
import {
    BrowserRouter,
    Navigate,
    Route,
    Routes
} from 'react-router-dom';

import ConfigurationContext from './elements/ConfigurationContext';
import Loading from './elements/Loading';
import ThemeContext from './elements/ThemeContext';
import Footer from './Footer';
import Header from './Header';
import Config from './pages/Config';
import Daysoff from './pages/Daysoff';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Schedule from './pages/Schedule';
import Summary from './pages/Summary';
import Welcome from './pages/Welcome';

import API from '../utils/api';
import Configuration from '../utils/configuration';
import Lang from '../utils/language';
import Tools from '../utils/tools';

import '../css/main.css';
import '../css/themes/dark.css';
import '../css/themes/light.css';
import '../css/utilities.css';
import Dashboard from './pages/Dashboard';

// Loading DayJS plugins
DayJS.extend(AdvancedFormat);
DayJS.extend(CustomParseFormat);

const RequireAuth = ({ children }) => {
    if (API.isAuth) {
        return children;
    }
    return (
        <Navigate to="/login" />
    );
};

class App extends Component {
    constructor(props) {
        super(props);
        // loads theme from the local storage before we can get it from the API
        const theme = Tools.getLocalStorageObject('theme');
        this.state = {
            loading: true,
            language: Lang.current,
            configuration: Configuration.data,
            setConfiguration: this.setConfiguration,
            theme: theme || 'light'
        };
    }

    async componentDidMount() {
        // sets the body css class according to the user preference
        this.updateTheme();
        // check authentication on init
        const that = this;
        const handleData = (data) => {
            if (data && data.auth && data.auth.token) {
                API.setAuth(data.auth);
                that.setState({
                    loading: false,
                    language: data.language,
                    configuration: data.configuration,
                    theme: data.theme
                });
            } else {
                API.unsetAuth();
                that.setState({
                    loading: false
                });
            }
        };
        const savedAuth = Tools.getLocalStorageObject('auth');
        if (savedAuth) {
            try {
                let auth = false;
                API.setAuth({
                    token: savedAuth.token,
                    userId: savedAuth.userId
                });
                const result = await API.call({
                    method: 'GET',
                    url: '/api/auth'
                });
                auth = result;
                const user = await API.call({
                    method: 'GET',
                    url: '/api/users/me'
                });
                await Configuration.load();
                Lang.setCurrent(user.language);
                handleData({
                    language: user.language,
                    theme: user.theme,
                    configuration: Configuration.data,
                    auth
                });
            } catch (err) {
                handleData(false);
            }
        } else {
            handleData(false);
        }
    }

    componentDidUpdate(_prevProps, prevState) {
        // checks and updates the theme whenever the state changes
        const { theme: currentTheme } = this.state;
        const { theme: previousTheme } = prevState;
        if (previousTheme !== currentTheme) {
            this.updateTheme();
        }
    }

    setConfiguration = (configuration) => {
        this.setState({
            configuration
        });
    };

    handleLanguage = (language) => {
        const { language: currentLanguage } = this.state;
        if (currentLanguage !== language) {
            this.setState({
                language
            });
        }
    };

    handleTheme = (theme) => {
        const { theme: currentTheme } = this.state;
        if (currentTheme !== theme) {
            this.setState({
                theme
            });
        }
    };

    // header navigation
    getHeader = () => (
        API.isAuth ? (
            <Header
                onLanguage={this.handleLanguage}
                onTheme={this.handleTheme}
            />
        ) : null
    );

    updateTheme() {
        // sets the body class according to the chosen theme
        const { theme } = this.state;
        const className = theme === 'dark' ? 'bp4-dark' : 'bp4';
        document.body.className = className;
    }

    render() {
        const {
            loading,
            theme,
            configuration,
            setConfiguration
        } = this.state;

        if (loading) {
            // loading while auth init
            return (
                <div id="app">
                    <Loading />
                </div>
            );
        }

        // app content
        return (
            <BrowserRouter>
                <div id="app">
                    {/* eslint-disable-next-line react/jsx-no-constructed-context-values */}
                    <ConfigurationContext.Provider value={{ configuration, setConfiguration }}>
                        <ThemeContext.Provider value={theme}>
                            <Routes>
                                { /* redirects exact "/" path to home page */ }
                                <Route
                                    path="/"
                                    element={(
                                        <RequireAuth>
                                            <Navigate to="/daysoff" />
                                        </RequireAuth>
                                    )}
                                />
                                { /* pages */ }
                                <Route
                                    path="/dashboard"
                                    element={(
                                        <RequireAuth>
                                            {this.getHeader()}
                                            <Dashboard />
                                        </RequireAuth>
                                    )}
                                />
                                <Route
                                    path="/daysoff"s
                                    element={(
                                        <RequireAuth>
                                            {this.getHeader()}
                                            <Daysoff />
                                        </RequireAuth>
                                    )}
                                />
                                <Route
                                    path="/schedule"
                                    element={(
                                        <RequireAuth>
                                            {this.getHeader()}
                                            <Schedule />
                                        </RequireAuth>
                                    )}
                                />
                                <Route
                                    path="/summary"
                                    element={(
                                        <RequireAuth>
                                            {this.getHeader()}
                                            <Summary />
                                        </RequireAuth>
                                    )}
                                />
                                <Route
                                    path="/config/settings"
                                    element={(
                                        <RequireAuth>
                                            {this.getHeader()}
                                            <Config content="settings" />
                                        </RequireAuth>
                                    )}
                                />
                                <Route
                                    path="/config/admins"
                                    element={(
                                        <RequireAuth>
                                            {this.getHeader()}
                                            <Config content="admins" />
                                        </RequireAuth>
                                    )}
                                />
                                <Route
                                    path="/config/types"
                                    element={(
                                        <RequireAuth>
                                            {this.getHeader()}
                                            <Config content="types" />
                                        </RequireAuth>
                                    )}
                                />
                                <Route
                                    path="/login"
                                    element={(
                                        <Login onTheme={this.handleTheme} />
                                    )}
                                />
                                { /* welcome page */ }
                                <Route
                                    path="/welcome/:secret"
                                    element={(
                                        <Welcome />
                                    )}
                                />
                                { /* handles any other path to 404 */ }
                                <Route
                                    path="*"
                                    element={(
                                        <RequireAuth>
                                            {this.getHeader()}
                                            <NotFound />
                                        </RequireAuth>
                                    )}
                                />
                            </Routes>
                            <Footer />
                        </ThemeContext.Provider>
                    </ConfigurationContext.Provider>
                </div>
            </BrowserRouter>
        );
    }
}

export default App;
