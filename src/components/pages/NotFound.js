import React from 'react';
import { Icon } from '@blueprintjs/core';

import Lang from '../../utils/language.js';

const NotFound = () => (
    <div id="content">
        <div className="page-not-found">
            <Icon icon="path-search" iconSize={75} />
            <div>{Lang.text('nav.notFound')}</div>
        </div>
    </div>
);

export default NotFound;
