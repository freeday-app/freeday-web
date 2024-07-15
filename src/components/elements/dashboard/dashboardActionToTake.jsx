import React from 'react';


import Language from '../../../utils/language';


const DashboardActionToTake = (props) => {
    const {
        action
    } = props;
    return (
        <span>
            {`${action} ${Language.text('dashboard.actions.pending')}`}
        </span>
    );
};

export default DashboardActionToTake;
