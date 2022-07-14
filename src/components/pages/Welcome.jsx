import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Icon,
    InputGroup,
    Button,
    Intent
} from '@blueprintjs/core';
import { Emoji } from 'emoji-mart';

import Loading from '../elements/Loading';
import API from '../../utils/api';
import Lang from '../../utils/language';
import Configuration from '../../utils/configuration';
import { useConfiguration } from '../elements/ConfigurationContext';
import Toaster from '../../utils/toaster';

import '../../css/pages/welcome.css';

const Welcome = () => {
    const { secret }= useParams();
    const navigate = useNavigate();
    const { setConfiguration } = useConfiguration();

    const [pageData, setPageData] = useState({
        loading: true,
        error: false,
        languageSelection: false,
        userCreation: false
    });
    const [userData, setUserData] = useState({
        username: null,
        password: null
    });
    const [language, setLanguage] = useState('en');

    const validateForm = () => {
        const { username, password } = userData;
        return (
            username && username.length >= 6
            && password && password.length >= 6
        );
    };

    const displayLanguageSelection = () => {
        setPageData({
            userCreation: false,
            languageSelection: true
        });
    };

    const handleLanguageSelection = (code) => {
        Lang.setCurrent(code);
        setLanguage(code);
        setPageData((previous) => ({
            ...previous,
            userCreation: true,
            languageSelection: false
        }));
    };

    const handleUserChange = (e) => {
        setUserData((previous) => ({
            ...previous,
            [e.target.name]: e.target.value
        }));
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        const { username, password } = userData;
        try {
            setPageData((previous) => ({
                ...previous,
                loading: true
            }));
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
            Lang.setCurrent(user.language);
            await Configuration.load();
            setConfiguration(Configuration.data);
            navigate('/daysoff');
        } catch (err) {
            setPageData((previous) => ({
                ...previous,
                loading: false
            }));
            Toaster.show({
                message: Lang.text('error.generic'),
                intent: Intent.DANGER
            });
        }
    };

    useEffect(() => {
        (async () => {
            try {
                // checks secret code validity
                await API.call({
                    method: 'GET',
                    url: '/api/auth/welcome',
                    token: secret
                });
                setPageData((previous) => ({
                    ...previous,
                    loading: false,
                    error: false
                }));
            } catch (err) {
                console.error(err);
                setPageData((previous) => ({
                    ...previous,
                    loading: false,
                    error: true
                }));
            }
        })();
    }, []);

    const {
        loading,
        error,
        userCreation,
        languageSelection
    } = pageData;

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
                <form className="login-form">
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
                                            onClick={() => handleLanguageSelection(code)}
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
                <form className="login-form" onSubmit={handleUserSubmit}>
                    <div className="welcome-title">
                        {Lang.text('welcome.createUser')}
                    </div>
                    <InputGroup
                        name="username"
                        placeholder={Lang.text('admin.form.username')}
                        leftIcon="user"
                        onChange={handleUserChange}
                    />
                    <InputGroup
                        name="password"
                        placeholder={Lang.text('admin.form.password')}
                        leftIcon="lock"
                        type="password"
                        onChange={handleUserChange}
                    />
                    <Button
                        type="submit"
                        icon="add"
                        intent={Intent.PRIMARY}
                        disabled={!validateForm()}
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
                    onClick={displayLanguageSelection}
                />
            </div>
        </div>
    );
}

export default Welcome;
