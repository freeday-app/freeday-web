import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import { Icon } from '@blueprintjs/core';
import QueryString from 'query-string';

import Loading from '../elements/Loading';
import API from '../../utils/api';
import Lang from '../../utils/language';

class SlackRegister extends Component {
    constructor(props) {
        super(props);
        const params = QueryString.parse(
            window.location.search
        );
        this.state = {
            done: false,
            error: false,
            oauthCode: params.code || null,
            oauthState: params.state || null
        };
    }

    async componentDidMount() {
        const that = this;
        try {
            const { oauthCode, oauthState } = this.state;
            // registers slack oauth code and state in api
            await API.call({
                method: 'POST',
                url: '/api/slack/auth',
                data: {
                    code: oauthCode,
                    state: oauthState
                }
            });
            that.setState({
                done: true,
                error: false
            });
        } catch (err) {
            console.error(err);
            that.setState({
                error: true
            });
        }
    }

    render() {
        const { done, error, home } = this.state;

        if (home) {
            return <Redirect to="/daysoff" />;
        }

        let data = {
            text: Lang.text('slack.registering'),
            icon: <Loading />
        };
        if (done && !error) {
            data = {
                text: Lang.text('slack.registered'),
                icon: <Icon className="color-green" icon="tick" iconSize={100} />
            };
        }
        if (error) {
            data = {
                text: Lang.text('slack.error.register'),
                icon: <Icon className="color-red" icon="cross" iconSize={100} />
            };
        }

        return (
            <div id="content">
                <div className="simple">
                    <div className="simple-text">
                        {data.text}
                    </div>
                    <div className="simple-icon">
                        {data.icon}
                    </div>
                </div>
            </div>
        );
    }
}

export default SlackRegister;
