import React from 'react';

import Configuration from '../../utils/configuration.js';

const ConfigurationContext = React.createContext({
    configuration: Configuration.data,
    setConfiguration: () => {}
});

export default ConfigurationContext;
