import React, { Component } from 'react';
import {
    Button, Classes, Dialog, Intent, FormGroup, InputGroup
} from '@blueprintjs/core';
import Lang from '../../../utils/language';

class CancelDialog extends Component {
    constructor(props) {
        super(props);
        this.state = {
            cancelReason: ''
        };
    }

    shouldComponentUpdate(nextProps) {
        const { isOpen } = this.props;
        if (!isOpen && nextProps.isOpen) {
            this.setState({
                cancelReason: ''
            });
        }
        return true;
    }

    render() {
        const {
            dayoffId,
            isOpen,
            onClose,
            onConfirm
        } = this.props;
        const { cancelReason } = this.state;
        return (
            <Dialog
                icon="warning-sign"
                onClose={() => onClose('cancel')}
                title={Lang.text('dayoff.dialog.cancel.title')}
                autoFocus
                canEscapeKeyClose
                canOutsideClickClose
                enforceFocus
                isOpen={isOpen}
                usePortal
            >
                <div className={Classes.DIALOG_BODY}>
                    <FormGroup
                        label={Lang.text('dayoff.dialog.cancel.text')}
                        className="dayoff-form-body-col"
                    >
                        <InputGroup
                            placeholder={Lang.text('dayoff.dialog.cancel.text')}
                            onChange={(e) => this.setState({
                                cancelReason: e.target.value
                            })}
                        />
                    </FormGroup>
                </div>
                <div className={Classes.DIALOG_FOOTER}>
                    <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                        <Button onClick={() => onClose('cancel')}>
                            {Lang.text('button.cancel')}
                        </Button>
                        <Button
                            intent={Intent.PRIMARY}
                            onClick={() => onConfirm(
                                dayoffId,
                                'cancel',
                                { cancelReason }
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

export default CancelDialog;
