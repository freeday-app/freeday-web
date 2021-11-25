import React from 'react';
import { HTMLTable } from '@blueprintjs/core';

import Lang from '../../../utils/language.js';
import DayoffItem from './DayoffItem.js';

const DayoffList = (props) => {
    const {
        daysoff,
        onEdit,
        onRefresh
    } = props;
    return (
        <HTMLTable id="dayoff-table" className="dayoff-table" interactive>
            <thead>
                <tr>
                    <th className="left">{Lang.text('dayoff.field.user')}</th>
                    <th>{Lang.text('dayoff.field.type')}</th>
                    <th>{Lang.text('dayoff.field.start')}</th>
                    <th>{Lang.text('dayoff.field.end')}</th>
                    <th>{Lang.text('dayoff.field.count')}</th>
                    <th>{Lang.text('dayoff.field.comment')}</th>
                    <th>{Lang.text('dayoff.field.important')}</th>
                    <th>{Lang.text('dayoff.field.status')}</th>
                    <th className="dayoff-action">{Lang.text('dayoff.field.actions')}</th>
                </tr>
            </thead>
            <tbody>
                {
                    daysoff.length > 0
                        ? daysoff.map((dayoff) => (
                            <DayoffItem
                                key={dayoff.id}
                                dayoff={dayoff}
                                onEdit={onEdit}
                                onRefresh={onRefresh}
                            />
                        ))
                        : (
                            <tr>
                                <td colSpan="9">
                                    <i>{Lang.text('dayoff.noData')}</i>
                                </td>
                            </tr>
                        )
                }
            </tbody>
        </HTMLTable>
    );
};

export default DayoffList;
