const selectWithButtonsStyles = {
    container: (base) => ({
        ...base,
        margin: '0 5px',
        flexGrow: 1
    })
};

const selectLightStyles = {
    control: (base) => ({
        ...base,
        borderColor: 'var(--palette-lightergrey)'
    }),
    input: (base) => ({
        ...base,
        color: 'var(--palette-black)'
    }),
    clearIndicator: (base) => ({
        ...base,
        cursor: 'pointer'
    }),
    dropdownIndicator: (base) => ({
        ...base,
        cursor: 'pointer'
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    option: (base) => ({
        ...base,
        ':hover': {
            backgroundColor: 'white',
            color: 'var(--palette-blue)'
        },
        backgroundColor: 'white',
        color: 'var(--palette-black)',
        cursor: 'pointer'
    }),
    multiValueRemove: (base) => ({
        ...base,
        cursor: 'pointer'
    })
};

const selectDarkStyles = {
    control: (base) => ({
        ...base,
        backgroundColor: 'var(--palette-darker)',
        borderColor: 'var(--palette-black)'
    }),
    input: (base) => ({
        ...base,
        color: 'var(--palette-white)'
    }),
    clearIndicator: (base) => ({
        ...base,
        cursor: 'pointer'
    }),
    dropdownIndicator: (base) => ({
        ...base,
        cursor: 'pointer'
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    option: (base) => ({
        ...base,
        ':hover': {
            backgroundColor: 'var(--palette-darker)',
            color: 'var(--palette-blue)'
        },
        backgroundColor: 'var(--palette-darker)',
        color: 'var(--palette-white)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    }),
    singleValue: (base) => ({
        ...base,
        color: 'var(--palette-white)'
    }),
    multiValue: (base) => ({
        ...base,
        backgroundColor: 'var(--palette-grey)'
    }),
    multiValueLabel: (base) => ({
        ...base,
        color: 'var(--palette-white)'
    }),
    multiValueRemove: (base) => ({
        ...base,
        ':hover': {
            backgroundColor: 'var(--palette-greyer)'
        },
        cursor: 'pointer'
    }),
    menu: (base) => ({
        ...base,
        backgroundColor: 'var(--palette-darker)'
    })
};

export default (theme, withButtons = false) => {
    let styles = theme === 'dark' ? selectDarkStyles : selectLightStyles;
    if (withButtons) {
        styles = { ...styles, ...selectWithButtonsStyles };
    }
    return styles;
};
