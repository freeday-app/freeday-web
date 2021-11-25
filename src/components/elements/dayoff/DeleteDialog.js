import React, { Component } from 'react';
import {
    Button, Classes, Dialog, Intent
} from '@blueprintjs/core';
import Lang from '../../../utils/language.js';

import Toaster from '../../../utils/toaster.js';
import API from '../../../utils/api.js';

export class DeleteDialog extends Component {
    // effectue suppression absence
    doDelete = async () => {
        try {
            const { dayoffId, handleParentState, daysoff } = this.props;
            handleParentState({
                deleteDialog: false,
                dayoffId: null
            });
            await API.call({
                method: 'DELETE',
                url: `/api/daysoff/${dayoffId}`
            });
            delete daysoff[dayoffId];
            handleParentState({ daysoff });
        } catch (err) {
            console.error(err);
            Toaster.show({
                message: Lang.text('dayoff.error.delete'),
                intent: Intent.DANGER
            });
        }
    };

    render() {
        const { isOpen, handleParentState } = this.props;
        return (
            <Dialog
                icon="warning-sign"
                onClose={() => handleParentState({ deleteDialog: false, dayoffId: null })}
                title={Lang.text('dayoff.dialog.delete.title')}
                autoFocus
                canEscapeKeyClose
                canOutsideClickClose
                enforceFocus
                isOpen={isOpen}
                usePortal
            >
                <div className={Classes.DIALOG_BODY}>
                    <p>{`${Lang.text('dayoff.dialog.delete.text')} ?`}</p>
                </div>
                <div className={Classes.DIALOG_FOOTER}>
                    <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                        <Button
                            onClick={() => handleParentState({
                                deleteDialog: false, dayoffId: null
                            })}
                        >
                            {Lang.text('button.cancel')}
                        </Button>
                        <Button intent={Intent.PRIMARY} onClick={this.doDelete}>
                            {Lang.text('button.confirm')}
                        </Button>
                    </div>
                </div>
            </Dialog>
        );
    }
}

export default DeleteDialog;
