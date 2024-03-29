import React, { Component } from 'react';
import { Picker } from 'emoji-mart';
import { Button, Position } from '@blueprintjs/core';
import { Popover2 } from '@blueprintjs/popover2';

import Emoji from './Emoji';

import Lang from '../../utils/language';

import 'emoji-mart/css/emoji-mart.css';
import '../../css/elements/emojiPicker.css';

class EmojiPicker extends Component {
    constructor(props) {
        super(props);
        this.state = {
            emoji: props.value || null,
            isOpen: false
        };
    }

    static getDerivedStateFromProps(nextProps) {
        return {
            emoji: nextProps.value
        };
    }

    handleInteraction(nextOpenState) {
        this.setState({
            isOpen: nextOpenState
        });
    }

    handleEmojiSelect(emoji) {
        const { onChange } = this.props;
        onChange(emoji.id);
        this.setState({
            emoji: emoji.id,
            isOpen: false
        });
    }

    handleEmojiClear() {
        const { onChange } = this.props;
        onChange(null);
        this.setState({
            emoji: null,
            isOpen: false
        });
    }

    render() {
        const {
            isOpen,
            emoji
        } = this.state;
        return (
            <div className="label-pushed-content">
                <Popover2
                    position={Position.RIGHT_TOP}
                    isOpen={isOpen}
                    onInteraction={(state) => this.handleInteraction(state)}
                    content={(
                        <div className="emoji-picker-content">
                            <Picker
                                darkMode
                                showPreview={false}
                                showSkinTones={false}
                                exclude={['recent']}
                                set="google"
                                sheetSize={64}
                                onSelect={(emj) => this.handleEmojiSelect(emj)}
                            />
                            <Button className="emoji-picker-clear" onClick={() => this.handleEmojiClear()}>
                                {Lang.text('emojiPicker.clear')}
                            </Button>
                        </div>
                    )}
                >
                    <Button id="emoji-picker-button" className="emoji-picker-button">
                        {
                            emoji
                                ? <Emoji emoji={emoji} size={20} />
                                : Lang.text('emojiPicker.none')
                        }
                    </Button>
                </Popover2>
            </div>
        );
    }
}

export default EmojiPicker;
