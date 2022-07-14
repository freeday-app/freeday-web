import React, { Component } from 'react';
import {
    BrowserRouter as Router,
    Route,
    Redirect,
    Switch
} from 'react-router-dom';
import DayJS from 'dayjs';
import AdvancedFormat from 'dayjs/plugin/advancedFormat';
import CustomParseFormat from 'dayjs/plugin/customParseFormat';

import Header from './Header';
import Footer from './Footer';
import Login from './pages/Login';
import Daysoff from './pages/Daysoff';
import Schedule from './pages/Schedule';
import Summary from './pages/Summary';
import Config from './pages/Config';
import Welcome from './pages/Welcome';
import NotFound from './pages/NotFound';
import SlackRegister from './pages/SlackRegister';
import Loading from './elements/Loading';
import ThemeContext from './elements/ThemeContext';
import ConfigurationContext from './elements/ConfigurationContext';

import API from '../utils/api';
import Configuration from '../utils/configuration';
import Lang from '../utils/language';
import Tools from '../utils/tools';

import '../css/main.css';
import '../css/themes/dark.css';
import '../css/themes/light.css';

// Loading DayJS plugins
DayJS.extend(AdvancedFormat);
DayJS.extend(CustomParseFormat);

// private routing handling authentication in react router
const PrivateRoute = ({ component: Comp, content, ...rest }) => (
    <Route
        render={(props) => {
            if (API.isAuth) {
                return <Comp {...props} content={content} />;
            }
            return <Redirect to="/login" />;
        }}
        {...rest}
    />
);

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

    componentDidUpdate(prevProps, prevState) {
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

    updateTheme() {
        // sets the body class according to the chosen theme
        const { theme } = this.state;
        const className = theme === 'dark' ? 'bp3-dark' : 'bp3';
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
            <Router>
                <div id="app">
                    {/* eslint-disable-next-line react/jsx-no-constructed-context-values */}
                    <ConfigurationContext.Provider value={{ configuration, setConfiguration }}>
                        <ThemeContext.Provider value={theme}>
                            { /* header navigation */ }
                            <Route
                                path="/"
                                render={(props) => (
                                    API.isAuth
                                        ? (
                                            <Header
                                                {...props}
                                                onLanguage={this.handleLanguage}
                                                onTheme={this.handleTheme}
                                            />
                                        ) : null
                                )}
                            />
                            { /* contenu page */ }
                            <Switch>
                                { /* redirects exact "/" path to home page */ }
                                <PrivateRoute exact path="/" render={() => <Redirect to="/daysoff" />} />
                                { /* pages */ }
                                <PrivateRoute exact path="/daysoff" component={Daysoff} />
                                <PrivateRoute exact path="/schedule" component={Schedule} />
                                <PrivateRoute exact path="/summary" component={Summary} />
                                <PrivateRoute exact path="/config/settings" component={Config} content="settings" />
                                <PrivateRoute exact path="/config/admins" component={Config} content="admins" />
                                <PrivateRoute exact path="/config/types" component={Config} content="types" />
                                <Route
                                    exact
                                    path="/login"
                                    render={(props) => (
                                        <Login {...props} onTheme={this.handleTheme} />
                                    )}
                                />
                                { /* slack oauth register page */ }
                                <Route exact path="/register" component={SlackRegister} />
                                { /* welcome page */ }
                                <Route exact path="/welcome/:secret" component={Welcome} />
                                { /* handles any other path to 404 */ }
                                <PrivateRoute path="/" component={NotFound} />
                            </Switch>
                            <Footer />
                        </ThemeContext.Provider>
                    </ConfigurationContext.Provider>
                </div>
            </Router>
        );
    }
}

export default App;
