import React, { Component } from 'react';
import {
    Classes,
    Label,
    Intent,
    FormGroup,
    InputGroup,
    Switch,
    Button,
    Alignment,
    H3
} from '@blueprintjs/core';

import EmojiPicker from '../EmojiPicker';
import Lang from '../../../utils/language';
import Tools, { TruncLength } from '../../../utils/tools';

class ConfigForm extends Component {
    input = (options) => (
        <FormGroup key={options.index} label={options.label} helperText={options.helper}>
            <InputGroup
                name={options.name}
                type={options.inputType || 'text'}
                placeholder={options.label}
                leftIcon={options.icon}
                onChange={(e) => options.handler(options.name, e.target.value)}
                value={options.value}
                autoComplete="off"
                maxLength={options.maxLength}
            />
        </FormGroup>
    );

    switch = (options) => (
        <FormGroup key={options.index} helperText={options.helper}>
            <Switch
                label={options.label}
                alignIndicator={Alignment.RIGHT}
                checked={options.value}
                onChange={() => options.handler(options.name, !options.value)}
            />
        </FormGroup>
    );

    emojiPicker = (options) => (
        <FormGroup key={options.index}>
            <Label className={`label-pushed ${Classes.INLINE}`}>
                {options.label}
                <EmojiPicker
                    onChange={(emoji) => options.handler(options.name, emoji)}
                    value={options.value}
                />
            </Label>
        </FormGroup>
    );

    cancelButton = (options) => {
        const { onCancel } = this.props;
        return (
            <Button
                key={options.index}
                icon="undo"
                text={Lang.text('button.cancel')}
                onClick={onCancel}
            />
        );
    };

    submitButton = (options) => (
        <Button
            key={options.index}
            type="submit"
            icon={options.create ? 'add' : 'floppy-disk'}
            intent={Intent.PRIMARY}
            text={options.create ? Lang.text('button.create') : Lang.text('button.save')}
            loading={options.loading}
            disabled={!options.validate()}
        />
    );

    render() {
        const {
            type,
            title,
            action,
            elements,
            onChange,
            onSubmit,
            loading
        } = this.props;
        if (action) {
            const isCreate = action === 'create';
            return (
                <div className={`config-form ${type}-container`}>
                    <H3 className="config-form-title">
                        {
                            isCreate
                                ? Lang.text(`${type}.new`)
                                : `${Lang.text(`${type}.edit`)} ${Tools.trunc(title, TruncLength.VERYLONG)}`
                        }
                    </H3>
                    <form className={`${type}-form`} onSubmit={onSubmit} autoComplete="off">
                        { /* inputs fake pour empêcher autocomplétion browser */ }
                        <input className="hidden" type="text" name="fakeUsername" />
                        <input className="hidden" type="password" name="fakePassword" />
                        { /**/ }
                        {elements.inputs.map((opts, idx) => {
                            const options = {
                                ...opts,
                                index: idx,
                                handler: onChange
                            };
                            switch (opts.type) {
                                case 'input':
                                    return this.input(options);
                                case 'switch':
                                    return this.switch(options);
                                case 'emojiPicker':
                                    return this.emojiPicker(options);
                                default:
                                    return null;
                            }
                        })}
                        <div className="config-form-buttons">
                            {elements.buttons.map((opts, idx) => {
                                switch (opts.type) {
                                    case 'submit':
                                        return this.submitButton({
                                            ...opts,
                                            index: idx,
                                            loading
                                        });
                                    case 'cancel':
                                        return this.cancelButton({
                                            index: idx
                                        });
                                    default:
                                        return null;
                                }
                            })}
                        </div>
                    </form>
                </div>
            );
        }
        return null;
    }
}

export default ConfigForm;
