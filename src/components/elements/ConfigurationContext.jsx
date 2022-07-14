import React, { useContext } from 'react';

import Configuration from '../../utils/configuration';

const ConfigurationContext = React.createContext({
    configuration: Configuration.data,
    setConfiguration: () => {}
});

export default ConfigurationContext;

export const useConfiguration = () => {
    const context = useContext(ConfigurationContext);
    if (!context) {
        throw new Error('useConfiguration must be used within an Configuration Provider');
    }
    return context;
};
