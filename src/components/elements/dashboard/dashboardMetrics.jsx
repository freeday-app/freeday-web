import React from 'react';


import { HTMLTable } from '@blueprintjs/core';
import Language from '../../../utils/language';


const DashboardMetrics = (props) => {
    const {
        daysoff,
        numberDaysoff,
        numberPresent,
        onEdit,
        onRefresh
    } = props;
    console.log('dans metrics');
    console.log(numberDaysoff);
    return (
        <HTMLTable id="metrics-table" className="summary-table">
            <thead>
                <tr>
                    <th>
                        <span className="dashboard-column-text">
                            {Language.text('dashboard.metrics.present')}
                        </span>
                    </th>
                    <th>
                        <span className="dashboard-column-text">
                            {Language.text('dashboard.metrics.missing')}
                        </span>
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <span className="dashboard-column-text">
                            {numberPresent}
                        </span>
                    </td>
                    <td>
                        <span className="dashboard-column-text">
                            {numberDaysoff}
                        </span>
                    </td>
                </tr>
            </tbody>
        </HTMLTable>
    );
};

export default DashboardMetrics;
