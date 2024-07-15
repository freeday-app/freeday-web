import React from 'react';

import { HTMLTable } from '@blueprintjs/core';
import Language from '../../../utils/language';




const DashboardActivityFeed = (props) => {
    const {
        action
    } = props;
    return (
        <HTMLTable id="actions-table" className="actions-table" interactive>
            <thead>
                <tr>
                    <th className="left">{Language.text('dashboard.activity.title')}</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <th>
                        3
                    </th>
                </tr>
            </tbody>
        </HTMLTable>
    );
};

export default DashboardActivityFeed;
