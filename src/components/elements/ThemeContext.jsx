import React from 'react';

// context used to pass the current theme from App to child components.
// the light theme is used by default if there is no context provider.
const ThemeContext = React.createContext('light');

export default ThemeContext;
