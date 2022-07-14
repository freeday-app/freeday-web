import React from 'react';
import { Intent } from '@blueprintjs/core';

import API from '../../utils/api';
import Toaster from '../../utils/toaster';
import Lang from '../../utils/language';
import Tools from '../../utils/tools';

import '../../css/elements/slackButton.css';

const SlackButton = () => {
    const handler = async (e) => {
        e.preventDefault();
        try {
            const redirect = Tools.buildUrl(
                encodeURI(window.location.origin),
                '/register'
            );
            const { url } = await API.call({
                method: 'GET',
                url: `/api/slack/auth?redirect=${redirect}`
            });
            window.location.href = url;
        } catch (err) {
            console.error(err);
            Toaster.show({
                message: Lang.text('slack.error.getAuth'),
                intent: Intent.DANGER
            });
        }
    };
    return (
        <button className="slack-button" type="button" onClick={handler}>
            <img
                alt="Add to Slack"
                src="https://platform.slack-edge.com/img/add_to_slack.png"
                srcSet={[
                    'https://platform.slack-edge.com/img/add_to_slack.png 1x',
                    'https://platform.slack-edge.com/img/add_to_slack@2x.png 2x'
                ].join(', ')}
            />
        </button>
    );
};

export default SlackButton;
