import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import { Button, InputGroup, Intent } from '@blueprintjs/core';
import { Emoji } from 'emoji-mart';

import API from '../../utils/api.js';
import Configuration from '../../utils/configuration.js';
import Lang from '../../utils/language.js';
import Toaster from '../../utils/toaster.js';
import ConfigurationContext from '../elements/ConfigurationContext.js';

import '../../css/pages/login.css';

class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            brandingName: null,
            brandingLogo: null,
            username: '',
            password: '',
            loading: true
        };
    }

    async componentDidMount() {
        try {
            const {
                brandingName,
                brandingLogo
            } = await API.call({
                method: 'GET',
                url: '/api/configuration/public'
            });
            this.setState({
                loading: false,
                brandingName,
                brandingLogo
            });
        } catch (err) {
            console.error(err);
            Toaster.show({
                message: Lang.text('login.error.credentials'),
                intent: Intent.DANGER
            });
        }
    }

    validateForm = () => {
        const { username, password } = this.state;
        return username.length > 0 && password.length > 0;
    }

    handleChange = (e) => {
        this.setState({
            [e.target.name]: e.target.value
        });
    }

    handleSubmit = async (e) => {
        e.preventDefault();
        const { context } = this;
        const { username, password } = this.state;
        const { onTheme } = this.props;
        try {
            this.setState({
                loading: true
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
            const user = await API.call({
                method: 'GET',
                url: '/api/users/me'
            });
            Lang.setCurrent(user.language);
            onTheme(user.theme);
            await Configuration.load();
            context.setConfiguration(
                Configuration.data
            );
        } catch (err) {
            this.setState({
                loading: false
            });
            console.error(err);
            Toaster.show({
                message: Lang.text('login.error.credentials'),
                intent: Intent.DANGER
            });
        }
    }

    render() {
        const {
            loading,
            brandingName,
            brandingLogo
        } = this.state;

        if (API.isAuth) {
            return <Redirect to="/daysoff" />;
        }

        return (
            <div className="content content-no-header">
                <form className="login-form" onSubmit={this.handleSubmit}>
                    <div className="login-header">
                        <div className="login-header-logo">
                            {
                                brandingLogo
                                    ? <img src={brandingLogo} alt="brandingLogo" />
                                    : <Emoji emoji="palm_tree" set="google" size={50} />
                            }
                        </div>
                        <h1>{`Freeday${brandingName ? ` ${brandingName}` : ''}`}</h1>
                    </div>
                    <InputGroup
                        name="username"
                        placeholder={Lang.text('admin.form.username')}
                        leftIcon="user"
                        onChange={this.handleChange}
                    />
                    <InputGroup
                        name="password"
                        placeholder={Lang.text('admin.form.password')}
                        leftIcon="lock"
                        type="password"
                        onChange={this.handleChange}
                    />
                    <Button
                        type="submit"
                        icon="log-in"
                        intent={Intent.PRIMARY}
                        disabled={!this.validateForm()}
                        text={Lang.text('login.submit')}
                        loading={loading}
                    />
                </form>
            </div>
        );
    }
}

Login.contextType = ConfigurationContext;

export default Login;
