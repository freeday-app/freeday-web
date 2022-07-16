import React from 'react';
import { components } from 'react-select';
import { Icon } from '@blueprintjs/core';

import Emoji from './Emoji';

const { Option } = components;

export const AvatarOption = (props) => {
    const { data: { label, avatar } } = props;
    return (
        <Option className="select-option" {...props}>
            {avatar ? (
                <div className="avatar select-avatar">
                    <img src={avatar} alt="avatar" />
                </div>
            ) : null}
            <span className="select-text">{label}</span>
        </Option>
    );
};

export const EmojiOption = (props) => {
    const { data: { label, emoji } } = props;
    return (
        <Option className="select-option" {...props}>
            {emoji ? (
                <Emoji className="select-emoji" emoji={emoji} size={20} />
            ) : null}
            <span className="select-text">{label}</span>
        </Option>
    );
};

export const IconOption = (props) => {
    const { data: { label, icon, iconClass } } = props;
    const iconClassName = `select-icon ${iconClass ?? ''}`;
    return (
        <Option className="select-option" {...props}>
            {icon ? (
                <Icon className={iconClassName} icon={icon} />
            ) : null}
            <span className="select-text">{label}</span>
        </Option>
    );
};

export default null;
