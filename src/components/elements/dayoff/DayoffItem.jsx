import React, { Component } from 'react';
import { Icon, Position } from '@blueprintjs/core';
import { Tooltip2 } from '@blueprintjs/popover2';
import { Emoji } from 'emoji-mart';

import Tools, { TruncLength } from '../../../utils/tools';
import Lang from '../../../utils/language';
import DayoffMenu from './DayoffMenu';

class DayoffItem extends Component {
    status = () => {
        const { dayoff } = this.props;
        if (dayoff.status === 'confirmed') {
            return (
                <div className="color-green">
                    <Icon className="dayoff-status-icon" icon="tick" />
                    <p>{Lang.text('dayoff.status.confirmed')}</p>
                </div>
            );
        }
        if (dayoff.status === 'canceled') {
            return (
                <Tooltip2 content={dayoff.cancelReason || ''} position={Position.BOTTOM}>
                    <div className="color-red">
                        <Icon className="dayoff-status-icon" icon="cross" />
                        <p>{Lang.text('dayoff.status.canceled')}</p>
                    </div>
                </Tooltip2>
            );
        }
        return (
            <div className="color-lightgrey">
                <Icon className="dayoff-status-icon" icon="disable" />
                <p>{Lang.text('dayoff.status.pending')}</p>
            </div>
        );
    };

    date = (date, dateFull) => (
        <Tooltip2 content={dateFull} position={Position.BOTTOM}>
            <span className="dayoff-date">{date}</span>
        </Tooltip2>
    );

    comment = (comment) => (
        <Tooltip2 content={comment || ''} position={Position.BOTTOM}>
            <span className="dayoff-truncated-comment">{comment ? Tools.trunc(comment, TruncLength.VERYLONG) : ''}</span>
        </Tooltip2>
    );

    dayoffType = (type) => (
        <Tooltip2 content={type || ''} position={Position.BOTTOM}>
            <span className="dayoff-truncated-type">{Tools.trunc(type, TruncLength.SHORT)}</span>
        </Tooltip2>
    );

    render() {
        const { dayoff, onEdit, onRefresh } = this.props;
        return (
            <tr key={dayoff.id} data-dayoffid={dayoff.id}>
                <td className="left dayoff-name">
                    <div className="avatar">
                        <img src={dayoff.avatar} alt="avatar" />
                    </div>
                    {dayoff.name}
                </td>
                <td className="dayoff-type">
                    {
                        dayoff.emoji
                            ? <Emoji emoji={dayoff.emoji} set="google" size={18} />
                            : ''
                    }
                    {this.dayoffType(dayoff.type)}
                </td>
                <td className="dayoff-start">{this.date(dayoff.start, dayoff.startFull)}</td>
                <td className="dayoff-end">{this.date(dayoff.end, dayoff.endFull)}</td>
                <td className="dayoff-count">{dayoff.count}</td>
                <td className="dayoff-comment">{this.comment(dayoff.comment)}</td>
                <td className="dayoff-important">
                    {
                        dayoff.important
                            ? <Emoji emoji="warning" set="google" size={18} />
                            : ''
                    }
                </td>
                <td className="dayoff-status">{this.status()}</td>
                <td className="dayoff-action">
                    <DayoffMenu
                        dayoffId={dayoff.id}
                        onEdit={onEdit}
                        onRefresh={onRefresh}
                    >
                        <Icon icon="cog" />
                    </DayoffMenu>
                </td>
            </tr>
        );
    }
}

export default DayoffItem;
