import React, { Component } from 'react';
import { Button, Intent } from '@blueprintjs/core';

import Loading from '../Loading';
import ConfigForm from './ConfigForm';
import ConfigList from './ConfigList';
import Lang from '../../../utils/language';

import '../../../css/pages/config.css';

class ConfigContent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            formLoading: false,
            action: null,
            defaultData: {},
            id: null,
            data: {},
            title: null
        };
    }

    componentDidMount() {
        this.loadContent();
    }

    // gère click bouton création
    handleCreate = () => {
        this.setState((prevState) => ({
            id: null,
            action: 'create',
            data: {
                ...prevState.defaultData
            }
        }));
    };

    // gère click dans liste (édition)
    handleEdit = async (id) => {
        const { title, data } = await this.getData(id);
        this.setState({
            id,
            action: 'edit',
            title,
            data
        });
    };

    // gère changement dans formulaire
    handleChange = (name, value) => {
        this.setState((prevState) => ({
            data: {
                ...prevState.data,
                [name]: value
            }
        }));
    };

    // gère submit formulaire
    handleSubmit = async (e) => {
        e.preventDefault();
        const { id, data: saveData } = this.state;
        this.setState({
            formLoading: true
        });
        try {
            this.setState({
                formLoading: true
            });
            await this.saveData(saveData, id);
            await this.loadContent();
            this.closeForm();
        } catch (err) {
            console.error(err);
            this.setState({
                formLoading: false
            });
        }
    };

    // gère annulation formulaire
    handleCancel = () => {
        this.closeForm();
    };

    // ferme formulaire et affiche liste
    closeForm = () => {
        const { defaultData } = this.state;
        this.setState({
            loading: false,
            formLoading: false,
            action: null,
            id: null,
            title: null,
            data: {
                ...defaultData
            }
        });
    };

    // gère confirmation de suppression
    handleDelete = async (id) => {
        const { defaultData } = this.state;
        this.setState({
            formLoading: true
        });
        try {
            this.setState({
                formLoading: true
            });
            await this.delete(id);
            await this.loadContent();
            this.setState({
                id: null,
                action: null,
                formLoading: false,
                ...defaultData
            });
        } catch (err) {
            console.error(err);
            this.setState({
                formLoading: false
            });
        }
    };

    list = () => {
        const type = this.getType();
        const { columns, rows, buttons } = this.listData();
        return (
            <>
                <div className="config-buttons">
                    <Button
                        className="config-button"
                        icon="add"
                        intent={Intent.PRIMARY}
                        text={Lang.text(`${type}.create`)}
                        onClick={this.handleCreate}
                    />
                </div>
                <ConfigList
                    type={type}
                    columns={columns}
                    rows={rows}
                    buttons={buttons}
                    onEdit={this.handleEdit}
                    onDelete={this.handleDelete}
                />
            </>
        );
    };

    form = () => {
        const {
            action,
            title,
            formLoading
        } = this.state;
        const type = this.getType();
        return (
            <ConfigForm
                action={action}
                type={type}
                loading={formLoading}
                onChange={this.handleChange}
                onDelete={this.handleDelete}
                onSubmit={this.handleSubmit}
                onCancel={this.handleCancel}
                title={title}
                elements={this.formElements(
                    action === 'create'
                )}
            />
        );
    };

    // rendu page
    render() {
        const { loading, action } = this.state;
        if (loading) {
            return (
                <div id="content">
                    <Loading />
                </div>
            );
        }
        const type = this.getType();
        return (
            <div className="content full-height">
                <div id={type} className="content-col content-center config-content">
                    {action ? this.form() : this.list()}
                </div>
            </div>
        );
    }
}

export default ConfigContent;
