import React, { Component } from 'react';
import {
    Intent,
    Button,
    FormGroup,
    InputGroup,
    FileInput,
    Icon,
    Tooltip,
    Position,
    Switch
} from '@blueprintjs/core';
import Select from 'react-select';

import API from '../../utils/api';
import Lang from '../../utils/language';
import Toaster from '../../utils/toaster';
import Loading from '../elements/Loading';
import File from '../../utils/file';
import Configuration from '../../utils/configuration';
import getSelectStyles from '../../utils/selectStyles';
import ThemeContext from '../elements/ThemeContext';
import ConfigurationContext from '../elements/ConfigurationContext';

class Settings extends Component {
    constructor(props) {
        super(props);
        const defaultConfiguration = {
            brandingName: null,
            brandingLogo: null,
            slackReferrer: null
        };
        this.state = {
            configuration: JSON.parse(JSON.stringify(defaultConfiguration)),
            slackChannels: [],
            slackChannelsById: {},
            inputFileName: null,
            loading: true,
            formLoading: false
        };
    }

    componentDidMount() {
        this.getData();
    }

    onChange(name, value) {
        const { configuration } = this.state;
        configuration[name] = value;
        this.setState({
            configuration
        });
    }

    async onLogoChange(e) {
        const that = this;
        const { configuration } = that.state;
        try {
            const file = e.target.files[0];
            // contrôle file size
            const isSizeValid = File.controlSize(file, 0.5);
            if (!isSizeValid) {
                Toaster.show({
                    message: Lang.text('settings.error.fileSize'),
                    intent: Intent.DANGER
                });
                return false;
            }
            // controls image dimensions
            const areDimensionsValid = await File.controlDimensions(file, 600, 600);
            if (!areDimensionsValid) {
                Toaster.show({
                    message: Lang.text('settings.error.fileDimensions'),
                    intent: Intent.DANGER
                });
                return false;
            }
            // resize image and converts to base64
            const base64 = await File.resizeImageToBase64(file, 100, 100);
            configuration.brandingLogo = base64;
            that.setState({
                configuration,
                inputFileName: file.name
            });
            return true;
        } catch (err) {
            Toaster.show({
                message: Lang.text('settings.error.file'),
                intent: Intent.DANGER
            });
            return false;
        }
    }

    onLogoClear() {
        const { configuration } = this.state;
        configuration.brandingLogo = null;
        this.setState({
            configuration,
            inputFileName: null
        });
    }

    onJobChange(name, value) {
        const { monthlyRecapJob } = this.state;
        monthlyRecapJob[name] = value;
        this.setState({
            monthlyRecapJob
        });
    }

    async getData() {
        try {
            // get settings of the monthly recap job
            const monthlyRecapJob = await API.call({
                method: 'GET',
                url: '/api/jobs/monthlyRecap'
            });
            // get all slack channels
            const result = await API.call({
                method: 'GET',
                url: '/api/slack/channels?onlyMember=false'
            });
            const allSlackChannels = result.slackChannels;
            // filter channels which the bot has access to
            const slackChannels = allSlackChannels.filter((channel) => channel.isMember);
            // get configuration
            const configuration = await API.call({
                method: 'GET',
                url: '/api/configuration'
            });

            const slackChannelsById = {};
            for (const slackChannel of allSlackChannels) {
                if (slackChannel.isMember || slackChannel.slackId === configuration.slackReferrer) {
                    slackChannelsById[slackChannel.slackId] = slackChannel;
                }
            }
            this.setState({
                loading: false,
                configuration,
                monthlyRecapJob,
                slackChannels,
                slackChannelsById
            });
        } catch (err) {
            console.error(err);
            Toaster.show({
                message: Lang.text('settings.error.get'),
                intent: Intent.DANGER
            });
        }
    }

    saveConf = async (e) => {
        e.preventDefault();
        const { context } = this;
        try {
            const {
                configuration,
                monthlyRecapJob
            } = this.state;
            this.setState({
                formLoading: true
            });
            // post new configuration to api
            const configResult = await API.call({
                method: 'POST',
                url: '/api/configuration',
                data: configuration
            });
            // the api will reject the request if the body contains the name
            delete monthlyRecapJob.name;
            // post new monthlyRecap job settings to api
            const monthlyRecapResult = await API.call({
                method: 'POST',
                url: '/api/jobs/monthlyRecap',
                data: monthlyRecapJob
            });
            // reloads local configuration for client
            await Configuration.load();
            // set configuration in context
            context.setConfiguration(
                Configuration.data
            );
            // set state
            this.setState({
                formLoading: false,
                configuration: configResult,
                monthlyRecapJob: monthlyRecapResult
            });
            // configuration toaster
            Toaster.show({
                message: Lang.text('settings.success.save'),
                intent: Intent.SUCCESS
            });
        } catch (err) {
            console.error(err);
            let errorMessage;
            switch (err.code) {
                case 4005:
                    errorMessage = 'settings.error.slackReferrer';
                    break;
                default:
                    errorMessage = 'settings.error.save';
            }
            Toaster.show({
                message: Lang.text(errorMessage),
                intent: Intent.DANGER
            });
            this.setState({
                formLoading: false
            });
        }
    };

    currentReferrerError() {
        const { slackChannelsById, configuration } = this.state;
        const { slackReferrer } = configuration;
        if (slackChannelsById[slackReferrer] && !slackChannelsById[slackReferrer].isMember) {
            return (
                <div className="settings-slack-referrer-error">
                    {Lang.text('settings.error.currentReferrer')}
                </div>
            );
        }
        return null;
    }

    render() {
        const {
            loading,
            formLoading,
            configuration,
            monthlyRecapJob,
            slackChannels,
            slackChannelsById,
            inputFileName
        } = this.state;
        const {
            brandingName,
            brandingLogo,
            slackReferrer
        } = configuration;
        if (loading) {
            return (
                <div id="content">
                    <Loading />
                </div>
            );
        }
        return (
            <ThemeContext.Consumer>
                {(themeValue) => (
                    <div className="content full-height">
                        <div id="settings" className="content-col content-center config-content">
                            <div className="config-form settings-container">
                                <form className="settings-form" onSubmit={this.saveConf} autoComplete="off">
                                    {/* branding name */}
                                    <FormGroup label={Lang.text('settings.form.brandingName')} helperText={Lang.text('settings.form.brandingNameHelper')}>
                                        <InputGroup
                                            name="brandingName"
                                            type="text"
                                            placeholder={Lang.text('settings.form.brandingName')}
                                            leftIcon="annotation"
                                            onChange={(e) => this.onChange('brandingName', e.target.value)}
                                            value={brandingName || ''}
                                            maxLength={50}
                                        />
                                    </FormGroup>
                                    {/* branding logo input file and image */}
                                    <FormGroup label={Lang.text('settings.form.brandingLogo')} helperText={Lang.text('settings.form.brandingLogoHelper')}>
                                        <FileInput
                                            text={inputFileName || '...'}
                                            onInputChange={(e) => this.onLogoChange(e)}
                                            inputProps={{ accept: '.jpg,.jpeg,.png' }}
                                            fill
                                        />
                                    </FormGroup>
                                    {
                                        configuration.brandingLogo ? (
                                            <div className="settings-branding-logo-container">
                                                <img
                                                    className="settings-branding-logo-image"
                                                    src={brandingLogo}
                                                    alt="brandingLogo"
                                                />
                                                <Icon
                                                    className="settings-branding-logo-icon"
                                                    icon="trash"
                                                    onClick={() => this.onLogoClear()}
                                                />
                                            </div>
                                        ) : null
                                    }
                                    {/* slack referrer select */}
                                    <FormGroup
                                        className="settings-slack-referrer-container"
                                        contentClassName="settings-slack-referrer-content"
                                        label={Lang.text('settings.form.slackReferrer')}
                                    >
                                        <Select
                                            className="settings-slack-referrer-select"
                                            classNamePrefix="react-select"
                                            placeholder={Lang.text('settings.form.slackReferrerNoResult')}
                                            noOptionsMessage={() => Lang.text('settings.form.slackReferrerNoResult')}
                                            styles={getSelectStyles(themeValue)}
                                            isClearable
                                            onChange={(opt) => this.onChange('slackReferrer', opt ? opt.value : null)}
                                            options={slackChannels.map((channel) => ({
                                                label: channel.name,
                                                value: channel.slackId
                                            }))}
                                            value={slackReferrer ? {
                                                value: slackReferrer,
                                                label: slackChannelsById[slackReferrer].name
                                            } : null}
                                        />
                                        <div className="summary-csv-helper">
                                            <Tooltip content={Lang.text('settings.form.slackReferrerHelper')} position={Position.BOTTOM}>
                                                <Icon icon="help" iconSize={20} />
                                            </Tooltip>
                                        </div>
                                        {this.currentReferrerError()}
                                    </FormGroup>
                                    {/* monthly recap */}
                                    <FormGroup
                                        className="settings-monthly-recap-container"
                                        contentClassName="settings-monthly-recap-content"
                                        // label={Lang.text('settings.form.monthlyRecap')}
                                    >
                                        <div className="setting-monthlyRecap-switch">
                                            <Switch
                                                label={Lang.text('settings.form.monthlyRecap')}
                                                checked={monthlyRecapJob.enabled}
                                                onChange={() => this.onJobChange('enabled', !monthlyRecapJob.enabled)}
                                            />
                                        </div>
                                        <div className="summary-csv-helper">
                                            <Tooltip content={Lang.text('settings.form.monthlyRecapHelper')} position={Position.BOTTOM}>
                                                <Icon icon="help" iconSize={20} />
                                            </Tooltip>
                                        </div>
                                    </FormGroup>
                                    {/* submit button */}
                                    <div className="config-form-buttons">
                                        <Button
                                            type="submit"
                                            icon="floppy-disk"
                                            intent={Intent.PRIMARY}
                                            text={Lang.text('button.save')}
                                            loading={formLoading}
                                        />
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </ThemeContext.Consumer>
        );
    }
}

Settings.contextType = ConfigurationContext;

export default Settings;
