import React from 'react';
import Language from '../../../utils/language';




const DashboardMetrics = (props) => {
    const {
        numberDaysoff,
        numberPresent,
    } = props;
    
    return (
        <div class="card">
            <div class="card-title">{Language.text('dashboard.metrics.title')}</div>
            <div class="card-content presences-absences">
                <div class="presence">{numberPresent}</div>
                <div class="absence">{numberDaysoff}</div>
            </div>
        </div>
    );
};

export default DashboardMetrics;
