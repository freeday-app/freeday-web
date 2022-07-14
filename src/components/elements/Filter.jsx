import React, { Component } from 'react';
import {
    FormGroup,
    Switch,
    NumericInput,
    Button,
    Intent
} from '@blueprintjs/core';
import { DateInput } from '@blueprintjs/datetime';
import Select from 'react-select';
import DayJS from 'dayjs';

import DayoffDate from '../../utils/dayoffDate';
import getSelectStyles from '../../utils/selectStyles';
import dateProps from '../../utils/dateProps';
import Lang from '../../utils/language';
import Validator from '../../utils/validator';
import {
    AvatarOption,
    EmojiOption,
    IconOption
} from './SelectOptions';
import ThemeContext from './ThemeContext';

import '../../css/elements/filter.css';

class Filter extends Component {
    start = () => {
        const { inline, data, onChange } = this.props;
        return (
            <FormGroup
                key="start"
                className="filter-group small"
                contentClassName="filter-content"
                label={Lang.text('filter.start')}
                inline={inline}
            >
                <DateInput
                    {...dateProps()}
                    onChange={(val) => onChange('date', 'start', val)}
                    value={
                        data.start !== null
                            ? DayJS(data.start).toDate()
                            : null
                    }
                    inputProps={{
                        intent: Validator.date(data.start) ? 'Default' : 'Danger'
                    }}
                    invalidDateMessage={Lang.text('date.invalid')}
                />
            </FormGroup>
        );
    };

    end = () => {
        const { inline, data, onChange } = this.props;
        return (
            <FormGroup
                key="end"
                className="filter-group small"
                contentClassName="filter-content"
                label={Lang.text('filter.end')}
                inline={inline}
            >
                <DateInput
                    {...dateProps()}
                    onChange={(val) => onChange('date', 'end', val)}
                    value={
                        data.end !== null
                            ? DayJS(data.end).toDate()
                            : null
                    }
                    inputProps={{
                        intent: Validator.date(data.end) ? 'Default' : 'Danger'
                    }}
                    invalidDateMessage={Lang.text('date.invalid')}
                />
            </FormGroup>
        );
    };

    month = () => {
        const { inline, data, onChange } = this.props;
        return (
            <FormGroup
                key="month"
                className="filter-group"
                contentClassName="filter-content"
                label={Lang.text('filter.month')}
                inline={inline}
            >
                <div className="select-with-buttons-container">
                    <Button
                        intent={Intent.PRIMARY}
                        icon="arrow-left"
                        onClick={() => onChange('select', 'month', 'decrease')}
                    />
                    <ThemeContext.Consumer>
                        {(themeValue) => (
                            <Select
                                classNamePrefix="react-select"
                                placeholder={Lang.text('filter.month')}
                                noOptionsMessage={() => Lang.text('filter.noResult')}
                                styles={getSelectStyles(themeValue, true)}
                                value={DayoffDate.getMonthValue(data.month)}
                                onChange={(val) => onChange('select', 'month', val)}
                                defaultValue={DayoffDate.getCurrentMonthValue()}
                                options={DayoffDate.getMonthValues()}
                            />
                        )}
                    </ThemeContext.Consumer>
                    <Button
                        intent={Intent.PRIMARY}
                        icon="arrow-right"
                        onClick={() => onChange('select', 'month', 'increase')}
                    />
                </div>
            </FormGroup>
        );
    };

    year = () => {
        const { inline, data, onChange } = this.props;
        return (
            <FormGroup
                key="year"
                className="filter-group small"
                contentClassName="filter-content"
                label={Lang.text('filter.year')}
                inline={inline}
            >
                <NumericInput
                    className="numeric-input"
                    fill
                    placeholder={Lang.text('filter.year')}
                    min={DayJS().year() - 10}
                    max={DayJS().year() + 10}
                    value={data.year}
                    onValueChange={(val) => onChange('number', 'year', val)}
                    intent={Validator.year(data.year) ? 'Default' : 'Danger'}
                />
            </FormGroup>
        );
    };

    slackUser = () => {
        const {
            slackUsers,
            inline,
            data,
            onChange
        } = this.props;
        return (
            <FormGroup
                key="slackUser"
                className="filter-group big"
                contentClassName="filter-content"
                label={Lang.text('filter.slackUsers')}
                inline={inline}
            >
                <ThemeContext.Consumer>
                    {(themeValue) => (
                        <Select
                            classNamePrefix="react-select"
                            isMulti
                            placeholder={Lang.text('filter.slackUsers')}
                            noOptionsMessage={() => Lang.text('filter.noResult')}
                            styles={getSelectStyles(themeValue)}
                            closeMenuOnSelect={false}
                            onChange={(val) => onChange('selectMultiple', 'slackUser', val)}
                            components={{ Option: AvatarOption }}
                            options={slackUsers.map((user) => ({
                                value: user.slackId,
                                label: user.name,
                                avatar: user.avatar
                            }))}
                            value={slackUsers.filter((user) => (
                                data.slackUser.includes(user.slackId)
                            )).map((user) => ({
                                value: user.slackId,
                                label: user.name
                            }))}
                        />
                    )}
                </ThemeContext.Consumer>
            </FormGroup>
        );
    };

    all = () => {
        const { data, onChange } = this.props;
        return (
            <FormGroup
                key="all"
                className="filter-group small"
                contentClassName="filter-content"
                label={Lang.text('filter.all')}
                inline
            >
                <Switch
                    checked={data.all}
                    onChange={() => onChange('switch', 'all', !data.all)}
                />
            </FormGroup>
        );
    };

    type = () => {
        const {
            dayoffTypes,
            inline,
            data,
            onChange
        } = this.props;
        return (
            <FormGroup
                key="type"
                className="filter-group"
                contentClassName="filter-content"
                label={Lang.text('filter.type')}
                inline={inline}
            >
                <ThemeContext.Consumer>
                    {(themeValue) => (
                        <Select
                            classNamePrefix="react-select"
                            placeholder={Lang.text('filter.type')}
                            noOptionsMessage={() => Lang.text('filter.noResult')}
                            styles={getSelectStyles(themeValue)}
                            isClearable
                            onChange={(val) => onChange('select', 'type', val)}
                            components={{ Option: EmojiOption }}
                            options={dayoffTypes.map((dt) => ({
                                value: dt.id,
                                label: dt.name,
                                emoji: dt.emoji
                            }))}
                            value={data.type ? {
                                value: data.type,
                                label: dayoffTypes.filter((dt) => (
                                    dt.id === data.type
                                )).shift().name
                            } : null}
                        />
                    )}
                </ThemeContext.Consumer>
            </FormGroup>
        );
    };

    status = () => {
        const { inline, data, onChange } = this.props;
        return (
            <FormGroup
                key="status"
                className="filter-group"
                contentClassName="filter-content"
                label={Lang.text('filter.status')}
                inline={inline}
            >
                <ThemeContext.Consumer>
                    {(themeValue) => (
                        <Select
                            classNamePrefix="react-select"
                            placeholder={Lang.text('filter.status')}
                            noOptionsMessage={() => Lang.text('filter.noResult')}
                            styles={getSelectStyles(themeValue)}
                            isClearable
                            onChange={(val) => onChange('select', 'status', val)}
                            components={{ Option: IconOption }}
                            options={[{
                                value: 'confirmed',
                                label: Lang.text('dayoff.status.confirmed'),
                                icon: 'tick',
                                iconClass: 'color-green'
                            }, {
                                value: 'canceled',
                                label: Lang.text('dayoff.status.canceled'),
                                icon: 'cross',
                                iconClass: 'color-red'
                            }, {
                                value: 'pending',
                                label: Lang.text('dayoff.status.pending'),
                                icon: 'disable',
                                iconClass: 'color-lightgrey'
                            }]}
                            value={data.status ? {
                                value: data.status,
                                label: Lang.text(`dayoff.status.${data.status}`)
                            } : null}
                        />
                    )}
                </ThemeContext.Consumer>
            </FormGroup>
        );
    };

    reset = () => {
        const { onReset } = this.props;
        return (
            <FormGroup
                className="filter-group filter-footer no-grow"
                contentClassName="filter-content"
                key="footer"
            >
                <Button
                    minimal
                    className="filter-reset bp3-intent-stealth"
                    icon="refresh"
                    text={Lang.text('button.reset')}
                    onClick={() => onReset()}
                />
            </FormGroup>
        );
    };

    render() {
        const { inline, prefix, fields } = this.props;
        return (
            <div className={`filter${inline ? ' filter-inline' : ''}${prefix ? ` ${prefix}-filter` : ''}`}>
                {
                    fields.map((field) => {
                        switch (field) {
                            case 'start':
                                return this.start();
                            case 'end':
                                return this.end();
                            case 'month':
                                return this.month();
                            case 'year':
                                return this.year();
                            case 'slackUser':
                                return this.slackUser();
                            case 'all':
                                return this.all();
                            case 'type':
                                return this.type();
                            case 'status':
                                return this.status();
                            case 'reset':
                                return this.reset();
                            default:
                                throw new Error(`Unexpected filter field ${field}`);
                        }
                    })
                }
            </div>
        );
    }
}

export default Filter;
