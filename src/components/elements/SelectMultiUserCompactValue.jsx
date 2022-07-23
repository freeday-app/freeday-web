import React from 'react';
import { components } from 'react-select';

import Lang from '../../utils/language';

// custom value container to display 'N user(s) selected'
// on a multiple react-select instead of the list of users
const SelectMultiUserCompactValue = ({
    children,
    ...props
}) => {
    const [values, input] = children;

    let customText = null;
    if (Array.isArray(values)) {
        const plural = values.length > 1;
        customText = Lang.text(
            `select.user${plural ? 's' : ''}Selected`
        ).replace('%s', values.length);
    }

    return (
        <components.ValueContainer {...props}>
            {customText ?? values}
            {input}
        </components.ValueContainer>
    );
};

export default SelectMultiUserCompactValue;
