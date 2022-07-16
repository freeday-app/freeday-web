import React from 'react';
import { Emoji as EmojiMart } from 'emoji-mart';

const Emoji = (props) => (
    <EmojiMart {...props} set="google" />
);

export default Emoji;
