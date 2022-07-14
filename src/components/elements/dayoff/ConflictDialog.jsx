import React, { Component } from 'react';
import {
    Button,
    Classes,
    Dialog,
    HTMLTable,
    Icon,
    Tooltip,
    Intent,
    Position,
    Radio
} from '@blueprintjs/core';

import Lang from '../../../utils/language';

import '../../../css/elements/dayoffConflict.css';

class ConflictDialog extends Component {
    constructor(props) {
        super(props);
        this.state = {
            dayoffId: props.dayoffId || null
        };
    }

    handleSelection = (dayoffId) => {
        this.setState({
            dayoffId
        });
    };

    status = (dayoff) => {
        if (dayoff.status === 'confirmed') {
            return (
                <div className="conflict-table-status color-green">
                    <Icon icon="tick" />
                    <p>{Lang.text('dayoff.status.confirmed')}</p>
                </div>
            );
        } if (dayoff.status === 'canceled') {
            return (
                <Tooltip content={dayoff.cancelReason} position={Position.BOTTOM}>
                    <div className="color-red">
                        <Icon icon="cross" />
                        <p>{Lang.text('dayoff.status.canceled')}</p>
                    </div>
                </Tooltip>
            );
        }
        return (
            <div className="conflict-table-status color-grey">
                <Icon icon="disable" />
                <p>{Lang.text('dayoff.status.pending')}</p>
            </div>
        );
    };

    render() {
        const {
            dayoffId,
            conflicts,
            isOpen,
            onClose,
            onConfirm
        } = this.props;
        const {
            dayoffId: stateDayoffId
        } = this.state;
        return (
            <Dialog
                className="conflict-dialog"
                icon="warning-sign"
                title={Lang.text('dayoff.dialog.conflict.title')}
                isOpen={isOpen}
                onClose={() => onClose('conflict')}
                autoFocus
                canEscapeKeyClose
                canOutsideClickClose
                enforceFocus
                usePortal
            >
                <div className={Classes.DIALOG_HEADER}>
                    <div>
                        <p>{Lang.text('dayoff.dialog.conflict.text')}</p>
                    </div>
                </div>
                <div className={Classes.DIALOG_BODY}>
                    <div className="conflict-content">
                        <HTMLTable interactive id="conflict-table" className="conflict-table">
                            <thead>
                                <tr className="conflict-table-row">
                                    <th>{Lang.text('dayoff.field.start')}</th>
                                    <th>{Lang.text('dayoff.field.end')}</th>
                                    <th>{Lang.text('dayoff.field.type')}</th>
                                    <th>{Lang.text('dayoff.field.count')}</th>
                                    <th>{Lang.text('dayoff.field.status')}</th>
                                    <th>{}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {conflicts.length > 0 ? (
                                    conflicts.map((dayoff) => (
                                        <tr
                                            key={dayoff.id}
                                            className="conflict-table-row"
                                            onClick={() => this.handleSelection(dayoff.id)}
                                        >
                                            <td>{dayoff.start}</td>
                                            <td>{dayoff.end}</td>
                                            <td>{dayoff.type}</td>
                                            <td>{dayoff.count}</td>
                                            <td>{this.status(dayoff)}</td>
                                            <td>
                                                <Radio
                                                    value={dayoff.id}
                                                    onChange={(e) => (
                                                        this.handleSelection(e.target.value)
                                                    )}
                                                    checked={dayoff.id === stateDayoffId}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5">
                                            <i>{Lang.text('dayoff.noData')}</i>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </HTMLTable>
                    </div>
                </div>
                <div className={Classes.DIALOG_FOOTER}>
                    <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                        <Button onClick={() => onClose('conflict')}>
                            {Lang.text('button.cancel')}
                        </Button>
                        <Button
                            intent={Intent.PRIMARY}
                            onClick={() => onConfirm(
                                stateDayoffId || dayoffId,
                                'conflict',
                                { force: true }
                            )}
                        >
                            {Lang.text('button.confirm')}
                        </Button>
                    </div>
                </div>
            </Dialog>
        );
    }
}

export default ConflictDialog;
