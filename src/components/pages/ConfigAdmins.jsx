import React from 'react';
import {
    Tag,
    Intent,
    Position
} from '@blueprintjs/core';
import { Tooltip2 } from '@blueprintjs/popover2';

import ConfigContent from '../elements/config/ConfigContent';
import API from '../../utils/api';
import Lang from '../../utils/language';
import Toaster from '../../utils/toaster';
import Tools, { TruncLength } from '../../utils/tools';

class ConfigAdmins extends ConfigContent {
    constructor(props) {
        super(props);
        const defaultData = {
            username: '',
            password: '',
            passwordConfirm: ''
        };
        this.state = {
            ...this.state,
            defaultData: JSON.parse(JSON.stringify(defaultData)),
            data: JSON.parse(JSON.stringify(defaultData)),
            users: []
        };
    }

    getType = () => 'admin';

    // récupère liste des users
    async loadContent() {
        try {
            const { users } = await API.call({
                method: 'GET',
                url: '/api/users?page=all'
            });
            this.setState({
                loading: false,
                users
            });
        } catch (err) {
            console.error(err);
            Toaster.show({
                message: Lang.text('admin.error.list'),
                intent: Intent.DANGER
            });
        }
    }

    // récupère données d'un user
    getData = async (id, data = null) => {
        try {
            const user = data || (
                await API.call({
                    method: 'GET',
                    url: `/api/users/${id}`
                })
            );
            return {
                title: user.username,
                data: {
                    username: user.username,
                    password: ''
                }
            };
        } catch (err) {
            console.error(err);
            Toaster.show({
                message: Lang.text('admin.error.get'),
                intent: Intent.DANGER
            });
        }
        return null;
    };

    // sauvegarde données user
    saveData = async (data, id = null) => {
        try {
            const urlSuffix = id ? `/${id}` : '';
            const { username, password } = data;
            const userData = { username };
            if (!id || password.length > 0) {
                userData.password = password;
            }
            const result = await API.call({
                method: 'POST',
                url: `/api/users${urlSuffix}`,
                data: userData
            });
            Toaster.show({
                message: Lang.text(`admin.success.${id ? 'edit' : 'create'}`),
                intent: Intent.SUCCESS
            });
            return result;
        } catch (err) {
            let errorMessage = id ? Lang.text('admin.error.edit') : Lang.text('admin.error.create');
            if (err.code === 4090) {
                errorMessage = Lang.text('admin.error.username');
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

    // supprime user
    delete = async (id) => {
        try {
            await API.call({
                method: 'DELETE',
                url: `/api/users/${id}`
            });
        } catch (err) {
            Toaster.show({
                message: Lang.text('admin.error.delete'),
                intent: Intent.DANGER
            });
            throw err;
        }
    };

    // valide formulaire user
    validate = () => (
        this.passwordMatch() && this.state.data.username.length >= 6 && (
            this.state.data.password.length >= 6 || (
                this.state.action === 'edit' && this.state.data.password.length === 0
            )
        )
    );

    // checks that password and password confirm match
    passwordMatch() {
        const { data: { password, passwordConfirm } } = this.state;
        return (
            !password && !passwordConfirm
        ) || ((
            password || passwordConfirm
        ) && password === passwordConfirm);
    }

    // éléments du formulaire user
    formElements = (isCreate = true) => ({
        inputs: [{
            type: 'input',
            name: 'username',
            label: Lang.text('admin.form.username'),
            helper: Lang.text('admin.form.securityRule'),
            icon: 'user',
            value: this.state.data.username || ''
        }, {
            type: 'input',
            inputType: 'password',
            name: 'password',
            label: Lang.text('admin.form.password'),
            helper: [
                Lang.text('admin.form.securityRule'),
                isCreate ? '' : `, ${Lang.text('admin.form.passwordEmpty', false)}`
            ].join(''),
            icon: 'lock',
            value: this.state.data.password || ''
        }, {
            type: 'input',
            inputType: 'password',
            name: 'passwordConfirm',
            label: Lang.text('admin.form.passwordConfirm'),
            helper: (
                this.passwordMatch() ? null : (
                    <span className="helper-error">
                        {Lang.text('admin.form.passwordDontMatch')}
                    </span>
                )
            ),
            icon: 'lock',
            value: this.state.data.passwordConfirm || ''
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
        const { users } = this.state;
        return {
            columns: [
                Lang.text('admin.form.username')
            ],
            rows: users.map((user) => ({
                id: user.id,
                name: user.username,
                cells: [
                    <>
                        <span className="config-name-inner">
                            <Tooltip2 key={`config-user-name-${user.id}`} content={user.username} position={Position.BOTTOM}>
                                <span className="truncated-cell">
                                    {Tools.trunc(user.username, TruncLength.LONG)}
                                </span>
                            </Tooltip2>
                        </span>
                        {
                            user.id === API.userId
                                ? <Tag className="config-admin-self">{Lang.text('admin.self')}</Tag>
                                : null
                        }
                    </>
                ],
                buttons: [{
                    type: 'edit'
                }, {
                    type: 'delete',
                    disabled: user.id === API.userId
                }]
            }))
        };
    };
}

export default ConfigAdmins;
