import React, { Component } from 'react';
import {
    Dialog,
    HTMLTable,
    Classes,
    Button,
    Intent
} from '@blueprintjs/core';

import Lang from '../../../utils/language.js';

class ConfigList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            deleteDialog: false,
            deleteId: null,
            deleteName: null
        };
    }

    deleteDialog = () => {
        const that = this;
        const { type, onDelete } = this.props;
        const { deleteId, deleteName } = this.state;
        const { deleteDialog } = this.state;
        const closeDialog = () => {
            that.setState({
                deleteDialog: false
            });
        };
        return (
            <Dialog
                icon="warning-sign"
                onClose={() => closeDialog()}
                title={Lang.text(`${type}.dialog.delete.title`)}
                autoFocus
                canEscapeKeyClose
                canOutsideClickClose
                enforceFocus
                isOpen={deleteDialog}
                usePortal
            >
                <div className={Classes.DIALOG_BODY}>
                    <p>
                        {`${Lang.text(`${type}.dialog.delete.text`)} `}
                        <b>{deleteName}</b>
                        {' ?'}
                    </p>
                </div>
                <div className={Classes.DIALOG_FOOTER}>
                    <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                        <Button onClick={() => closeDialog()}>
                            {Lang.text('button.cancel')}
                        </Button>
                        <Button
                            intent={Intent.PRIMARY}
                            onClick={() => {
                                onDelete(deleteId);
                                closeDialog();
                            }}
                        >
                            {Lang.text('button.confirm')}
                        </Button>
                    </div>
                </div>
            </Dialog>
        );
    };

    render() {
        const {
            columns,
            rows,
            onEdit
        } = this.props;
        return (
            <div className="config-list">
                <HTMLTable id="config-list-table" className="config-list-table" striped>
                    <thead>
                        <tr>
                            {
                                columns.map((col) => (
                                    <th key={col}>{col}</th>
                                ))
                            }
                            <th>{}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.id} data-id={row.id}>
                                {
                                    row.cells.map((cell, idx) => (
                                        <td key={`config-list-cell-${idx.toString()}`}>
                                            {cell}
                                        </td>
                                    ))
                                }
                                <td className="config-list-buttons right">
                                    {
                                        row.buttons.map((button, idx) => {
                                            switch (button.type) {
                                                case 'edit':
                                                    return (
                                                        <Button
                                                            key={`config-list-button-${idx.toString()}`}
                                                            disabled={!!button.disabled}
                                                            icon="edit"
                                                            minimal
                                                            intent={Intent.PRIMARY}
                                                            onClick={() => onEdit(row.id)}
                                                        />
                                                    );
                                                case 'delete':
                                                    return (
                                                        <Button
                                                            key={`config-list-button-${idx.toString()}`}
                                                            disabled={!!button.disabled}
                                                            icon="trash"
                                                            minimal
                                                            intent={Intent.DANGER}
                                                            onClick={() => this.setState({
                                                                deleteDialog: true,
                                                                deleteId: row.id,
                                                                deleteName: row.name
                                                            })}
                                                        />
                                                    );
                                                default:
                                                    return null;
                                            }
                                        })
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </HTMLTable>
                {this.deleteDialog()}
            </div>
        );
    }
}

export default ConfigList;
