import React from 'react';

import Language from '../../../utils/language';




const DashboardActivityFeed = (props) => {
    const {
        action
    } = props;
    return (
        <div class="card">
            <div class="card-title">{Language.text('dashboard.activity.title')}</div>
            <div class="card-content last-activities">Last activities content here</div>
        </div>
    );
};

export default DashboardActivityFeed;
