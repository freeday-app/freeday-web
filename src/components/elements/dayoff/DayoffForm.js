import React, { Component } from 'react';
import {
    Button,
    Classes,
    Dialog,
    FormGroup,
    Intent,
    Switch,
    InputGroup
} from '@blueprintjs/core';
import { DateInput } from '@blueprintjs/datetime';
import Select from 'react-select';
import DayJS from 'dayjs';

import Lang from '../../../utils/language.js';
import getSelectStyles from '../../../utils/selectStyles.js';
import dateProps from '../../../utils/dateProps.js';
import { AvatarOption, EmojiOption } from '../SelectOptions.js';
import ThemeContext from '../ThemeContext.js';

import '../../../css/elements/dayoffForm.css';
import API from '../../../utils/api.js';
import DayoffPage from '../../../utils/dayoffPage.js';
import Toaster, { ToasterTimeout } from '../../../utils/toaster.js';
import Tools from '../../../utils/tools.js';

class DayoffForm extends Component {
    constructor(props) {
        super(props);
        const defaultState = {
            loading: false,
            dayoff: null,
            slackUser: null,
            type: null,
            start: null,
            startPeriod: null,
            end: null,
            endPeriod: null,
            comment: null,
            cancelReason: null,
            emptyStartError: false,
            emptyTypeError: false,
            emptySlackUserError: false,
            endBeforeStartError: false
        };
        this.defaultState = defaultState;
        this.state = { ...defaultState };
    }

    async shouldComponentUpdate(nextProps) {
        const { isOpen } = this.props;
        if (!isOpen && nextProps.isOpen) {
            // si édition absence
            if (nextProps.dayoffId) {
                try {
                    this.setState({ loading: true });
                    const dayoff = await DayoffPage.getDayoff(nextProps.dayoffId);
                    this.setState({
                        loading: false,
                        ...this.defaultState,
                        dayoff,
                        slackUser: dayoff.slackUser.slackId,
                        type: dayoff.type.id,
                        start: DayJS(dayoff.start).format('YYYY-MM-DD'),
                        startPeriod: dayoff.startPeriod,
                        end: DayJS(dayoff.end).format('YYYY-MM-DD'),
                        endPeriod: dayoff.endPeriod,
                        comment: dayoff.comment,
                        cancelReason: dayoff.cancelReason
                    });
                } catch (err) {
                    console.error(err);
                    Toaster.show({
                        message: err.message,
                        intent: Intent.DANGER
                    });
                }
            } else { // si création absence
                this.setState({
                    ...this.defaultState
                });
            }
        }
        return true;
    }

    // gère submit formulaire absence
    handleFormSubmit = async () => {
        const {
            dayoff,
            cancelReason,
            type,
            start,
            slackUser
        } = this.state;
        const {
            filter,
            handleParentState
        } = this.props;
        const isEdit = !!dayoff;
        try {
            const formState = this.state;
            // parse données formulaire
            const dayoffData = {
                type,
                start
            };
            ['startPeriod', 'end', 'endPeriod', 'comment'].forEach((field) => {
                if (formState[field]) {
                    dayoffData[field] = formState[field];
                }
            });
            if (!isEdit) {
                dayoffData.slackUserId = slackUser;
            }
            if (dayoff && dayoff.canceled) {
                dayoffData.cancelReason = cancelReason;
            }
            // ajoute / modifie l'absence
            const result = await API.call({
                method: 'POST',
                url: `/api/daysoff${isEdit ? `/${dayoff.id}` : ''}`,
                data: dayoffData
            });
            if (result.code) {
                let warningMessage = null;
                switch (result.code) {
                    case 2060:
                        warningMessage = 'dayoff.warning.notifyReferrer';
                        break;
                    case 2061:
                        warningMessage = 'dayoff.warning.notifyUser';
                        break;
                    default:
                        console.error(result);
                }
                if (warningMessage) {
                    Toaster.show({
                        message: Lang.text(warningMessage),
                        intent: Intent.WARNING,
                        timeout: ToasterTimeout.LONG
                    });
                }
            }
            // ferme modale si call API ok
            handleParentState({
                formDialog: false,
                dayoffId: null
            });
            // update liste absences
            const daysoff = await DayoffPage.getDaysoff(filter);
            handleParentState({ daysoff });
        } catch (err) {
            this.setState({ loading: false });
            let errorMessage;
            switch (err.code) {
                case 4001:
                    errorMessage = 'dayoff.error.noWorkDays';
                    break;
                case 4002:
                    errorMessage = 'dayoff.error.endBeforeStart';
                    break;
                case 4090:
                    errorMessage = 'dayoff.error.conflict';
                    break;
                default:
                    console.error(err);
                    errorMessage = `dayoff.error.${isEdit ? 'edit' : 'create'}`;
            }
            Toaster.show({
                message: Lang.text(errorMessage),
                intent: Intent.DANGER
            });
        }
    };

    // gère submit formulaire
    handleSubmit = () => {
        this.setState({ loading: true });
        // validation formulaire
        const errors = this.validateForm();
        // si validation formulaire a échoué
        if (errors) {
            this.setState({
                loading: false,
                ...errors
            });
        } else { // si pas d'erreur de validation
            this.handleFormSubmit();
        }
    };

    // renvoie les erreurs de validation du formulaire, null si aucune erreur
    // erreurs renvoyées sous forme d'objet pour mettre à jour le state
    validateForm() {
        const { state } = this;
        const { start, end } = state;
        // validation formulaire
        const errors = {};
        let atLeastOneError = false;
        // contrôle champs vides
        ['slackUser', 'type', 'start'].forEach((field) => {
            const isError = state[field] === null;
            errors[`empty${Tools.ucfirst(field)}Error`] = isError;
            if (isError) { atLeastOneError = true; }
        });
        // contrôle date de début et date de fin
        const isEndBeforeStartError = (
            start && end && new Date(start) > new Date(end)
        );
        errors.endBeforeStartError = isEndBeforeStartError;
        if (isEndBeforeStartError) {
            atLeastOneError = true;
            Toaster.show({
                message: Lang.text('dayoff.error.endBeforeStart'),
                intent: Intent.DANGER
            });
        }
        // renvoie résultat
        return atLeastOneError ? errors : null;
    }

    // rendu formulaire
    render() {
        const {
            dayoff,
            type,
            slackUser,
            emptySlackUserError,
            emptyTypeError,
            emptyStartError,
            endBeforeStartError,
            start,
            startPeriod,
            end,
            endPeriod,
            comment,
            cancelReason,
            loading
        } = this.state;
        const {
            dayoffTypes,
            slackUsers,
            handleParentState,
            isOpen
        } = this.props;
        // si édition ou ajout d'absence
        const isEdit = !!dayoff;
        // données pour select type d'absence
        const dayoffTypeSelectOptions = dayoffTypes.map((dt) => ({
            value: dt.id,
            label: dt.name,
            emoji: dt.emoji
        }));
        const dayoffTypeSelectedOption = dayoffTypeSelectOptions.filter((opt) => (
            type && opt.value === type
        )).shift();
        // données pour select user slack
        const slackUserSelectOptions = slackUsers.map((user) => ({
            value: user.slackId,
            label: user.name,
            avatar: user.avatar
        }));
        const slackUserSelectedOption = slackUserSelectOptions.filter((opt) => (
            slackUser && opt.value === slackUser
        )).shift();
        // rendu
        return (
            <ThemeContext.Consumer>
                {(themeValue) => (
                    <Dialog
                        icon="form"
                        onClose={() => handleParentState({
                            formDialog: false,
                            dayoffId: null
                        })}
                        title={Lang.text(`dayoff.dialog.form.${isEdit ? 'editTitle' : 'title'}`)}
                        autoFocus
                        canEscapeKeyClose
                        canOutsideClickClose
                        enforceFocus
                        isOpen={isOpen}
                        usePortal
                    >
                        <div className={Classes.DIALOG_BODY}>
                            <div className="dayoff-form-body">
                                <div className="dayoff-form-body-row">
                                    { /* utilisateur */ }
                                    <FormGroup
                                        className="dayoff-form-body-col dayoff-form-body-col-half"
                                        label={Lang.text('dayoff.field.slackUser')}
                                    >
                                        <Select
                                            className={emptySlackUserError ? 'error' : ''}
                                            classNamePrefix="react-select"
                                            placeholder={Lang.text('dayoff.field.slackUser')}
                                            noOptionsMessage={() => Lang.text('filter.noResult')}
                                            styles={getSelectStyles(themeValue)}
                                            onChange={(val) => this.setState({
                                                slackUser: val.value
                                            })}
                                            components={{ Option: AvatarOption }}
                                            options={slackUserSelectOptions}
                                            value={slackUserSelectedOption || null}
                                            isDisabled={isEdit}
                                        />
                                    </FormGroup>
                                    { /* type d'absence */ }
                                    <FormGroup
                                        className="dayoff-form-body-col dayoff-form-body-col-half"
                                        label={Lang.text('dayoff.field.type')}
                                    >
                                        <Select
                                            className={emptyTypeError ? 'error' : ''}
                                            classNamePrefix="react-select"
                                            placeholder={Lang.text('dayoff.field.type')}
                                            noOptionsMessage={() => Lang.text('filter.noResult')}
                                            styles={getSelectStyles(themeValue)}
                                            onChange={(val) => this.setState({
                                                type: val.value
                                            })}
                                            components={{ Option: EmojiOption }}
                                            options={dayoffTypeSelectOptions}
                                            value={dayoffTypeSelectedOption || null}
                                        />
                                    </FormGroup>
                                </div>
                                <div className="dayoff-form-body-row">
                                    { /* date de début */ }
                                    <FormGroup
                                        className="dayoff-form-body-col dayoff-form-body-col-half"
                                        label={Lang.text('dayoff.field.start')}
                                    >
                                        <DateInput
                                            className={emptyStartError || endBeforeStartError ? 'error' : ''}
                                            {...dateProps()}
                                            onChange={(val) => this.setState({
                                                start: val !== null ? DayJS(val).format('YYYY-MM-DD') : null
                                            })}
                                            value={start ? new Date(start) : null}
                                        />
                                    </FormGroup>
                                    <FormGroup
                                        className="dayoff-form-body-col dayoff-form-body-col-quarter"
                                        label={Lang.text('period.am')}
                                    >
                                        <Switch
                                            checked={startPeriod === 'am'}
                                            onChange={() => {
                                                this.setState({
                                                    startPeriod: startPeriod !== 'am' ? 'am' : null
                                                });
                                            }}
                                        />
                                    </FormGroup>
                                    <FormGroup
                                        className="dayoff-form-body-col dayoff-form-body-col-quarter"
                                        label={Lang.text('period.pm')}
                                    >
                                        <Switch
                                            checked={startPeriod === 'pm'}
                                            onChange={() => this.setState({
                                                startPeriod: startPeriod !== 'pm' ? 'pm' : null
                                            })}
                                        />
                                    </FormGroup>
                                </div>
                                <div className="dayoff-form-body-row">
                                    { /* date de fin */ }
                                    <FormGroup
                                        className="dayoff-form-body-col dayoff-form-body-col-half"
                                        label={Lang.text('dayoff.field.end')}
                                        helperText={Lang.text('dayoff.dialog.form.endEmpty')}
                                    >
                                        <DateInput
                                            className={endBeforeStartError ? 'error' : ''}
                                            {...dateProps()}
                                            onChange={(val) => this.setState({
                                                end: val !== null ? DayJS(val).format('YYYY-MM-DD') : null
                                            })}
                                            value={end ? new Date(end) : null}
                                        />
                                    </FormGroup>
                                    <FormGroup
                                        className="dayoff-form-body-col dayoff-form-body-col-quarter"
                                        label={Lang.text('period.am')}
                                    >
                                        <Switch
                                            checked={endPeriod === 'am'}
                                            onChange={() => {
                                                this.setState({
                                                    endPeriod: endPeriod !== 'am' ? 'am' : null
                                                });
                                            }}
                                        />
                                    </FormGroup>
                                    <FormGroup
                                        className="dayoff-form-body-col dayoff-form-body-col-quarter"
                                        label={Lang.text('period.pm')}
                                    >
                                        <Switch
                                            checked={endPeriod === 'pm'}
                                            onChange={() => this.setState({
                                                endPeriod: endPeriod !== 'pm' ? 'pm' : null
                                            })}
                                        />
                                    </FormGroup>
                                </div>
                            </div>
                            <div className="dayoff-form-body-row">
                                { /* commentaire */ }
                                <FormGroup
                                    className="dayoff-form-body-col"
                                    label={Lang.text('dayoff.field.comment')}
                                >
                                    <InputGroup
                                        placeholder={Lang.text('dayoff.field.comment')}
                                        onChange={(e) => this.setState({
                                            comment: e.target.value
                                        })}
                                        value={comment || ''}
                                    />
                                </FormGroup>
                            </div>
                            { dayoff && dayoff.canceled && (
                                <div className="dayoff-form-body-row">
                                    { /* raison d'annulation */ }
                                    <FormGroup
                                        className="dayoff-form-body-col"
                                        label={Lang.text('dayoff.dialog.cancel.text')}
                                    >
                                        <InputGroup
                                            placeholder={Lang.text('dayoff.dialog.cancel.text')}
                                            onChange={(e) => this.setState({
                                                cancelReason: e.target.value
                                            })}
                                            value={cancelReason || ''}
                                        />
                                    </FormGroup>
                                </div>
                            )}
                        </div>
                        <div className={Classes.DIALOG_FOOTER}>
                            <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                                <Button
                                    onClick={() => handleParentState({
                                        formDialog: false,
                                        dayoffId: null
                                    })}
                                >
                                    {Lang.text('button.cancel')}
                                </Button>
                                <Button
                                    intent={Intent.PRIMARY}
                                    loading={loading}
                                    onClick={this.handleSubmit}
                                >
                                    {Lang.text('button.confirm')}
                                </Button>
                            </div>
                        </div>
                    </Dialog>
                )}
            </ThemeContext.Consumer>
        );
    }
}

export default DayoffForm;
