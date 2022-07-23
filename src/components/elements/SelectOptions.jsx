import React from 'react';
import { components } from 'react-select';
import { Icon } from '@blueprintjs/core';

import Emoji from './Emoji';

const { Option } = components;

const OptionSelectedIcon = () => (
    <div className="select-selected-icon">
        <Icon icon="tick" />
    </div>
);

export const AvatarOption = (props) => {
    const {
        data: {
            label,
            avatar
        },
        isSelected
    } = props;
    return (
        <Option className="select-option" {...props}>
            {avatar ? (
                <div className="avatar select-avatar">
                    <img src={avatar} alt="avatar" />
                </div>
            ) : null}
            <div className="select-text">{label}</div>
            {isSelected ? <OptionSelectedIcon /> : null}
        </Option>
    );
};

export const EmojiOption = (props) => {
    const {
        data: {
            label,
            emoji
        },
        isSelected
    } = props;
    return (
        <Option className="select-option" {...props}>
            {emoji ? (
                <Emoji className="select-emoji" emoji={emoji} size={20} />
            ) : null}
            <div className="select-text">{label}</div>
            {isSelected ? <OptionSelectedIcon /> : null}
        </Option>
    );
};

export const IconOption = (props) => {
    const {
        data: {
            label,
            icon,
            iconClass
        },
        isSelected
    } = props;
    const iconClassName = `select-icon ${iconClass ?? ''}`;
    return (
        <Option className="select-option" {...props}>
            {icon ? (
                <Icon className={iconClassName} icon={icon} />
            ) : null}
            <div className="select-text">{label}</div>
            {isSelected ? <OptionSelectedIcon /> : null}
        </Option>
    );
};

export default null;
