import React, { Component } from 'react';
import {
    Menu,
    MenuItem,
    Intent,
    Position
} from '@blueprintjs/core';
import { Popover2 } from '@blueprintjs/popover2';

import CancelDialog from './CancelDialog';
import ConflictDialog from './ConflictDialog';
import Lang from '../../../utils/language';
import DayoffPage from '../../../utils/dayoffPage';

class DayoffMenu extends Component {
    constructor(props) {
        super(props);
        this.state = {
            conflicts: [],
            cancelDialog: false,
            conflictDialog: false,
            dayoffId: null
        };
    }

    static getDerivedStateFromProps(nextProps) {
        return {
            dayoffId: nextProps.dayoffId || null
        };
    }

    // gère ouverture popup
    handleDialogOpen = (dayoffId, action, data = null) => {
        if (action === 'cancel') {
            this.setState({
                dayoffId,
                cancelDialog: true
            });
        } else if (action === 'conflict') {
            this.setState({
                dayoffId,
                conflictDialog: true,
                conflicts: data
            });
        } else if (action === 'edit') {
            this.setState({
                dayoffId
            });
        }
    };

    // gère confirmation de popup
    handleDialogConfirm = (dayoffId, action, data = null) => {
        if (action === 'cancel') {
            this.setState({
                cancelDialog: false,
                dayoffId: null
            });
            this.handleAction(dayoffId, 'cancel', data);
        } else if (action === 'conflict') {
            this.setState({
                conflictDialog: false,
                dayoffId: null,
                conflicts: []
            });
            this.handleAction(dayoffId, 'confirm', data);
        }
    };

    // gère fermeture de popup
    handleDialogClose = (action) => {
        if (action === 'cancel') {
            this.setState({
                cancelDialog: false,
                dayoffId: null
            });
        } else if (action === 'conflict') {
            this.setState({
                conflictDialog: false,
                dayoffId: null,
                conflicts: []
            });
        } else if (action === 'edit') {
            this.setState({
                dayoffId: null
            });
        }
    };

    // gère actions boutons tableau
    handleAction = async (id, action, data = null) => {
        try {
            const { onRefresh } = this.props;
            // effectue action sur absence
            const throwConflict = action === 'confirm';
            await DayoffPage.dayoffAction(
                id,
                action,
                data,
                throwConflict
            );
            await onRefresh();
        } catch (err) {
            // si confirmation et que erreur de conflit ouvre popup conflit
            if (action === 'confirm' && err.code === 4090 && (
                !data || !data.force
            )) {
                const dayoff = await DayoffPage.getDayoff(id);
                const conflicts = DayoffPage.parseDaysoffForDisplay([
                    dayoff,
                    ...err.data
                ]);
                this.handleDialogOpen(id, 'conflict', conflicts);
            } else {
                throw err;
            }
        }
    };

    render() {
        const {
            dayoffId,
            cancelDialog,
            conflicts,
            conflictDialog
        } = this.state;
        const {
            children,
            onEdit,
            exclude
        } = this.props;
        let isExclude = false;
        if (exclude) {
            isExclude = Array.isArray(exclude)
                ? exclude
                : [exclude];
        }
        return (
            <>
                {/* context menu */}
                <Popover2
                    position={Position.BOTTOM}
                    content={(
                        <Menu>
                            {!isExclude || !exclude.includes('confirm') ? (
                                <MenuItem
                                    icon="tick"
                                    text={Lang.text('button.confirm')}
                                    intent={Intent.SUCCESS}
                                    onClick={() => this.handleAction(dayoffId, 'confirm')}
                                />
                            ) : null}
                            {!isExclude || !exclude.includes('cancel') ? (
                                <MenuItem
                                    icon="cross"
                                    text={Lang.text('button.cancel')}
                                    intent={Intent.WARNING}
                                    onClick={() => this.handleDialogOpen(dayoffId, 'cancel')}
                                />
                            ) : null}
                            {!isExclude || !exclude.includes('reset') ? (
                                <MenuItem
                                    icon="undo"
                                    text={Lang.text('button.reset')}
                                    intent={Intent.NONE}
                                    onClick={() => this.handleAction(dayoffId, 'reset')}
                                />
                            ) : null}
                            {!isExclude || !exclude.includes('edit') ? (
                                <MenuItem
                                    icon="edit"
                                    text={Lang.text('button.edit')}
                                    intent={Intent.PRIMARY}
                                    onClick={() => onEdit(dayoffId)}
                                />
                            ) : null}
                        </Menu>
                    )}
                >
                    {children}
                </Popover2>
                {/* cancel confirmation dialog */}
                {!isExclude || !exclude.includes('cancel') ? (
                    <CancelDialog
                        dayoffId={dayoffId}
                        isOpen={cancelDialog}
                        onConfirm={this.handleDialogConfirm}
                        onClose={this.handleDialogClose}
                    />
                ) : null}
                {/* conflict dialog */}
                {!isExclude || !exclude.includes('confirm') ? (
                    <ConflictDialog
                        dayoffId={dayoffId}
                        conflicts={conflicts}
                        isOpen={conflictDialog}
                        onConfirm={this.handleDialogConfirm}
                        onClose={this.handleDialogClose}
                    />
                ) : null}
            </>
        );
    }
}

export default DayoffMenu;
