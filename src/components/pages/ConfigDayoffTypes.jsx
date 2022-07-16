import React from 'react';
import {
    Intent,
    Icon,
    Position
} from '@blueprintjs/core';
import { Tooltip2 } from '@blueprintjs/popover2';
import Emoji from '../elements/Emoji';

import ConfigContent from '../elements/config/ConfigContent';
import DayoffPage from '../../utils/dayoffPage';
import API from '../../utils/api';
import Lang from '../../utils/language';
import Toaster from '../../utils/toaster';
import Tools, { TruncLength } from '../../utils/tools';

class ConfigDayoffTypes extends ConfigContent {
    static NAME_MAXLENGTH = 75;

    constructor(props) {
        super(props);
        const defaultData = {
            name: '',
            emoji: null,
            enabled: true,
            displayed: true,
            important: false
        };
        this.state = {
            ...this.state,
            defaultData: JSON.parse(JSON.stringify(defaultData)),
            data: JSON.parse(JSON.stringify(defaultData)),
            dayoffTypes: []
        };
    }

    getType = () => 'dayoffType';

    // récupère liste des types d'absence
    async loadContent() {
        const dayoffTypes = await DayoffPage.getDayoffTypes();
        this.setState({
            loading: false,
            dayoffTypes
        });
    }

    // récupère données d'un type d'absence
    getData = async (id, data = null) => {
        try {
            const dayoffType = data || (
                await API.call({
                    method: 'GET',
                    url: `/api/daysoff/types/${id}`
                })
            );
            return {
                title: dayoffType.name,
                data: {
                    name: dayoffType.name,
                    emoji: dayoffType.emoji,
                    enabled: dayoffType.enabled,
                    displayed: dayoffType.displayed,
                    important: dayoffType.important
                }
            };
        } catch (err) {
            console.error(err);
            Toaster.show({
                message: Lang.text('dayoffType.error.get'),
                intent: Intent.DANGER
            });
        }
        return null;
    };

    // sauvegarde données type d'absence
    saveData = async (data, id = null) => {
        try {
            const urlSuffix = id ? `/${id}` : '';
            const result = await API.call({
                method: 'POST',
                url: `/api/daysoff/types${urlSuffix}`,
                data
            });
            Toaster.show({
                message: Lang.text(`dayoffType.success.${id ? 'edit' : 'create'}`),
                intent: Intent.SUCCESS
            });
            return result;
        } catch (err) {
            let errorMessage = id
                ? Lang.text('dayoffType.error.edit')
                : Lang.text('dayoffType.error.create');
            if (err.code === 4090) {
                errorMessage = Lang.text('dayoffType.error.conflict');
            } else {
                console.error(err);
            }
            Toaster.show({
                message: errorMessage,
                intent: Intent.DANGER
            });
            throw err;
        }
    };

    // valide formulaire type d'absence
    validate = () => (
        this.state.data.name.length > 0
        && this.state.data.name.length <= ConfigDayoffTypes.NAME_MAXLENGTH
    );

    // éléments du formulaire type d'absence
    formElements = (isCreate = true) => ({
        inputs: [{
            type: 'input',
            name: 'name',
            label: Lang.text('dayoffType.form.name'),
            helper: Lang.text('dayoffType.form.nameHelp'),
            icon: 'annotation',
            value: this.state.data.name,
            maxLength: ConfigDayoffTypes.NAME_MAXLENGTH
        }, {
            type: 'emojiPicker',
            name: 'emoji',
            label: Lang.text('dayoffType.form.emoji'),
            value: this.state.data.emoji
        }, {
            type: 'switch',
            name: 'enabled',
            label: Lang.text('dayoffType.form.enabled'),
            value: this.state.data.enabled,
            helper: Lang.text(`dayoffType.form.${
                this.state.data.enabled ? 'enabled' : 'disabled'
            }Help`)
        }, {
            type: 'switch',
            name: 'displayed',
            label: Lang.text('dayoffType.form.displayed'),
            value: this.state.data.displayed,
            helper: Lang.text(`dayoffType.form.${
                this.state.data.displayed ? 'displayed' : 'notDisplayed'
            }Help`)
        }, {
            type: 'switch',
            name: 'important',
            label: Lang.text('dayoffType.form.important'),
            value: this.state.data.important,
            helper: Lang.text(`dayoffType.form.${
                this.state.data.important ? 'important' : 'notImportant'
            }Help`)
        }],
        buttons: [{
            type: 'cancel'
        }, {
            type: 'submit',
            create: isCreate,
            validate: this.validate
        }]
    });

    listData = () => {
        const { dayoffTypes } = this.state;
        const checkIcon = (checked) => (
            checked ? <Icon icon="tick" /> : null
        );
        return {
            columns: [
                <span className="config-name-inner" key={`dayoffType-${Lang.text('dayoffType.form.name')}`}>
                    {Lang.text('dayoffType.form.name')}
                </span>,
                Lang.text('dayoffType.form.emoji'),
                Lang.text('dayoffType.form.enabled'),
                Lang.text('dayoffType.form.displayed'),
                Lang.text('dayoffType.form.important')
            ],
            rows: dayoffTypes.map((type) => {
                const {
                    id,
                    name,
                    emoji,
                    enabled,
                    displayed,
                    important
                } = type;
                return {
                    id,
                    name,
                    cells: [
                        (
                            <Tooltip2 key={`dayoff-type-${id}`} content={name || ''} position={Position.BOTTOM}>
                                <span className="truncated-cell">{Tools.trunc(name, TruncLength.LONG)}</span>
                            </Tooltip2>
                        ),
                        emoji ? <Emoji emoji={emoji} size={20} /> : '',
                        checkIcon(enabled),
                        checkIcon(displayed),
                        checkIcon(important)
                    ],
                    buttons: [{
                        type: 'edit'
                    }]
                };
            })
        };
    };
}

export default ConfigDayoffTypes;
