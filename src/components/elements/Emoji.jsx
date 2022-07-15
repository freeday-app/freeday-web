import React from 'react';
import { Emoji as EmojiMart } from 'emoji-mart';

import Apple16 from '../../assets/emoji-mart/apple_16.png';
import Apple20 from '../../assets/emoji-mart/apple_20.png';
import Apple32 from '../../assets/emoji-mart/apple_32.png';
import Apple64 from '../../assets/emoji-mart/apple_64.png';
import Facebook16 from '../../assets/emoji-mart/facebook_16.png';
import Facebook20 from '../../assets/emoji-mart/facebook_20.png';
import Facebook32 from '../../assets/emoji-mart/facebook_32.png';
import Facebook64 from '../../assets/emoji-mart/facebook_64.png';
import Google16 from '../../assets/emoji-mart/google_16.png';
import Google20 from '../../assets/emoji-mart/google_20.png';
import Google32 from '../../assets/emoji-mart/google_32.png';
import Google64 from '../../assets/emoji-mart/google_64.png';
import Twitter16 from '../../assets/emoji-mart/twitter_16.png';
import Twitter20 from '../../assets/emoji-mart/twitter_20.png';
import Twitter32 from '../../assets/emoji-mart/twitter_32.png';
import Twitter64 from '../../assets/emoji-mart/twitter_64.png';

const spreadsheets = {
    apple: {
        16: Apple16,
        20: Apple20,
        32: Apple32,
        64: Apple64
    },
    facebook: {
        16: Facebook16,
        20: Facebook20,
        32: Facebook32,
        64: Facebook64
    },
    google: {
        16: Google16,
        20: Google20,
        32: Google32,
        64: Google64
    },
    twitter: {
        16: Twitter16,
        20: Twitter20,
        32: Twitter32,
        64: Twitter64
    }
};

export const getSpreadSheet = (set, sheetSize) => (
    spreadsheets[set][sheetSize]
);

const Emoji = (props) => (
    <EmojiMart
        {...props}
        set="google"
        sheetSize={64}
        backgroundImageFn={getSpreadSheet}
    />
);

export default Emoji;
