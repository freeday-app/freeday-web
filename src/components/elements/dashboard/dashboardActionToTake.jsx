import React from 'react';


import Language from '../../../utils/language';


const DashboardActionToTake = (props) => {
    const {
        action
    } = props;

    const message = action ===0
    ? Language.text('dashboard.actions.none')
    : `${action} ${Language.text('dashboard.actions.pending')}`;

    return (
        <div class="card">
            <div class="card-title">{Language.text('dashboard.actions.title')}</div>
            <div class="card-content pending-days-off">{message}</div>
        </div>
    );
};

export default DashboardActionToTake;
