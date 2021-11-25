import React, { Component } from 'react';
import { Redirect, withRouter } from 'react-router-dom';
import {
    Icon,
    InputGroup,
    Button,
    Intent
} from '@blueprintjs/core';
import { Emoji } from 'emoji-mart';

import Loading from '../elements/Loading.js';
import API from '../../utils/api.js';
import Lang from '../../utils/language.js';
import Configuration from '../../utils/configuration.js';
import Toaster from '../../utils/toaster.js';

import '../../css/pages/welcome.css';

class Welcome extends Component {
    constructor(props) {
        super(props);
        const { match: { params: { secret } } } = this.props;
        this.state = {
            secret,
            username: null,
            password: null,
            language: 'en',
            loading: true,
            error: false,
            languageSelection: false,
            userCreation: false
        };
    }

    async componentDidMount() {
        const that = this;
        try {
            // checks secret code validity
            const { secret } = this.state;
            await API.call({
                method: 'GET',
                url: '/api/auth/welcome',
                token: secret
            });
            that.setState({
                loading: false,
                error: false
            });
        } catch (err) {
            console.error(err);
            that.setState({
                loading: false,
                error: true
            });
        }
    }

    validateForm = () => {
        const { username, password } = this.state;
        return (
            username && username.length >= 6
            && password && password.length >= 6
        );
    }

    displayLanguageSelection = () => {
        this.setState({
            userCreation: false,
            languageSelection: true
        });
    }

    handleLanguageSelection = (code) => {
        Lang.setCurrent(code);
        this.setState({
            language: code,
            userCreation: true,
            languageSelection: false
        });
    }

    handleUserChange = (e) => {
        this.setState({
            [e.target.name]: e.target.value
        });
    }

    handleUserSubmit = async (e) => {
        e.preventDefault();
        const {
            secret,
            username,
            password,
            language
        } = this.state;
        try {
            this.setState({
                loading: true
            });
            const user = await API.call({
                method: 'POST',
                url: '/api/auth/welcome',
                token: secret,
                data: {
                    username,
                    password,
                    language
                }
            });
            const result = await API.call({
                method: 'POST',
                url: '/api/auth',
                data: {
                    username,
                    password
                }
            });
            API.setAuth(result);
            await Configuration.load();
            Lang.setCurrent(user.language);
            this.setState({
                loading: false
            });
        } catch (err) {
            this.setState({
                loading: false
            });
            Toaster.show({
                message: Lang.text('error.generic'),
                intent: Intent.DANGER
            });
        }
    }

    render() {
        const {
            loading,
            error,
            userCreation,
            languageSelection
        } = this.state;

        if (API.isAuth) {
            return <Redirect to="/daysoff" />;
        }

        if (loading) {
            return (
                <div className="content content-no-header">
                    <Loading />
                </div>
            );
        }

        if (error) {
            return (
                <div className="content content-no-header">
                    <div className="simple">
                        <div className="simple-text">
                            {Lang.text('error.generic')}
                        </div>
                        <div className="simple-icon">
                            <Icon className="color-red" icon="cross" iconSize={100} />
                        </div>
                    </div>
                </div>
            );
        }

        if (languageSelection) {
            return (
                <div className="content content-no-header">
                    <form className="login-form" onSubmit={this.handleSubmit}>
                        <div className="welcome-title">
                            {Lang.text('welcome.selectLanguage')}
                            <div className="welcome-language-list">
                                {
                                    Object.keys(Lang.languages).map((code) => {
                                        const lang = Lang.languages[code];
                                        return (
                                            <button
                                                type="button"
                                                key={`lang-${code}`}
                                                className="welcome-language-item"
                                                onClick={() => this.handleLanguageSelection(code)}
                                            >
                                                <Emoji emoji={lang.emoji} set="google" size={50} />
                                                <div className="welcome-language-name">
                                                    {lang.name}
                                                </div>
                                            </button>
                                        );
                                    })
                                }
                            </div>
                        </div>
                    </form>
                </div>
            );
        }

        if (userCreation) {
            return (
                <div className="content content-no-header">
                    <form className="login-form" onSubmit={this.handleUserSubmit}>
                        <div className="welcome-title">
                            {Lang.text('welcome.createUser')}
                        </div>
                        <InputGroup
                            name="username"
                            placeholder={Lang.text('admin.form.username')}
                            leftIcon="user"
                            onChange={this.handleUserChange}
                        />
                        <InputGroup
                            name="password"
                            placeholder={Lang.text('admin.form.password')}
                            leftIcon="lock"
                            type="password"
                            onChange={this.handleUserChange}
                        />
                        <Button
                            type="submit"
                            icon="add"
                            intent={Intent.PRIMARY}
                            disabled={!this.validateForm()}
                            text={Lang.text('button.create')}
                        />
                    </form>
                </div>
            );
        }

        return (
            <div className="content content-no-header">
                <div className="login-form">
                    <div className="welcome-intro-title">
                        {Lang.text('welcome.intro')}
                    </div>
                    <Button
                        className="welcome-intro-button"
                        type="submit"
                        icon="flag"
                        intent={Intent.PRIMARY}
                        text={Lang.text('button.start')}
                        onClick={this.displayLanguageSelection}
                    />
                </div>
            </div>
        );
    }
}

export default withRouter(Welcome);
