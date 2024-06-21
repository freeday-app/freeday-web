import React, { Component } from 'react';
import { Button, Intent } from '@blueprintjs/core';
import { CSVLink } from 'react-csv';

import Lang from '../../../utils/language';

class SideButtons extends Component {
    // parse et renvoie données pour export csv
    getCSVData = () => {
        const {
            parsedDaysoff
        } = this.props;
        const status = (dayoff) => {
            if (dayoff.status === 'confirmed' || dayoff.status === 'canceled') {
                return Lang.text(`dayoff.status.${dayoff.status}`);
            }
            return '';
        };
        const csvData = [[
            Lang.text('dayoff.field.user'),
            Lang.text('dayoff.field.type'),
            Lang.text('dayoff.field.start'),
            Lang.text('dayoff.field.end'),
            Lang.text('dayoff.field.count'),
            Lang.text('dayoff.field.comment'),
            Lang.text('dayoff.field.status')
        ]];
        parsedDaysoff.forEach((dayoff) => {
            csvData.push([
                dayoff.name,
                dayoff.type,
                dayoff.start,
                dayoff.end,
                dayoff.count,
                dayoff.comment,
                status(dayoff)
            ]);
        });
        return csvData;
    };

    render() {
        const {
            handleParentState
        } = this.props;
        return (
            <div className="dayoff-buttons">
                <CSVLink data={this.getCSVData()} filename="freeday-csv-export.csv">
                    <Button
                        className="dayoff-button"
                        icon="th"
                        intent={Intent.PRIMARY}
                        text={Lang.text('button.csv')}
                    />
                </CSVLink>
                <Button
                    className="dayoff-button"
                    icon="add"
                    intent={Intent.PRIMARY}
                    text={Lang.text('dayoff.button.create')}
                    onClick={() => handleParentState({ formDialog: true })}
                />
            </div>
        );
    }
}

export default SideButtons;
