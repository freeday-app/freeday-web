import React from 'react';
import { Intent, Spinner } from '@blueprintjs/core';

const Loading = () => (
    <div className="loading">
        <Spinner intent={Intent.PRIMARY} size={100} />
    </div>
);

export default Loading;
