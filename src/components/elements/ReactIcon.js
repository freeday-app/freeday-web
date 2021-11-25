import React from 'react';
import { Classes } from '@blueprintjs/core';
import {
    FaSlack
} from 'react-icons/fa'; // eslint-disable-line
import { IconContext } from 'react-icons';

const ReactIcon = (props) => {
    const icons = {
        slack: FaSlack
    };
    const { icon, size } = props;
    const Icon = icons[icon];
    // eslint-disable-next-line react/jsx-no-constructed-context-values
    const context = {
        style: {
            fontSize: `${size || 16}px`
        }
    };
    return (
        <span className={Classes.ICON}>
            <IconContext.Provider value={context}>
                <Icon />
            </IconContext.Provider>
        </span>
    );
};

export default ReactIcon;
