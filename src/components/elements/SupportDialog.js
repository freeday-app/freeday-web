import React from 'react';
import {
    Card,
    Elevation,
    Tabs,
    Tab,
    Dialog
} from '@blueprintjs/core';
import Lang from '../../utils/language.js';

import '../../css/elements/supportDialog.css';

// onglet de contact
const ContactPanel = () => {
    const splitText = Lang.text('support.contact.text').split('%s');
    return (
        <div>
            <h2>{Lang.text('support.contact.title')}</h2>
            {splitText[0]}
            <a href={`mailto:${Lang.text('support.contact.email')}`}>
                {Lang.text('support.contact.email', false)}
            </a>
            {splitText[1]}
        </div>
    );
};

// fonction d'affichage du contenu textuel d'un onglet
const displayTexts = (texts) => (
    texts.map((text, textIdx) => (
        <React.Fragment key={`tabContent-${textIdx.toString()}`}>
            {text.title && <h3>{text.title}</h3>}
            {text.bodies.map((body, bodyIdx) => (
                Array.isArray(body) ? (
                    <ul key={`tabContentList-${bodyIdx.toString()}`}>
                        {body.map((subBody, subBodyIdx) => (
                            <li key={`tabContentListItem-${subBodyIdx.toString()}`}>
                                {subBody}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p key={`tabContentList-${bodyIdx.toString()}`}>
                        {body}
                    </p>
                )
            ))}
        </React.Fragment>
    ))
);

// onglet cgu
const CguPanel = () => {
    const texts = Lang.data('support.cgu.texts');
    return (
        <div className="support-panel cgu-panel">
            <h2>{Lang.text('support.cgu.titleLong')}</h2>
            <div>{displayTexts(texts)}</div>
        </div>
    );
};

// onglet infos légales
const LegalPanel = () => {
    const texts = Lang.data('support.legal.texts');
    return (
        <div className="support-panel legal-panel">
            <h2>{Lang.text('support.legal.title')}</h2>
            <div>{displayTexts(texts)}</div>
        </div>
    );
};

// onglet données personnelles
const DataPanel = () => {
    const texts = Lang.data('support.data.texts');
    return (
        <div className="support-panel data-panel">
            <h2>{Lang.text('support.data.title')}</h2>
            <div>{displayTexts(texts)}</div>
        </div>
    );
};

// composant modale support
const SupportDialog = ({ isOpen, onClose }) => (
    <Dialog
        isOpen={isOpen}
        onClose={onClose}
        className="support-dialog"
        title={Lang.text('nav.support')}
        autoFocus
        canEscapeKeyClose
        canOutsideClickClose
        enforceFocus
        usePortal
    >
        <Card elevation={Elevation.TWO}>
            <Tabs
                renderActiveTabPanelOnly="true"
                vertical="true"
            >
                <Tab id="contact" className="support-tab" title={Lang.text('support.contact.title')} panel={<ContactPanel />} />
                <Tab id="cgu" className="support-tab" title={Lang.text('support.cgu.title')} panel={<CguPanel />} />
                <Tab id="legal" className="support-tab" title={Lang.text('support.legal.title')} panel={<LegalPanel />} />
                <Tab id="data" className="support-tab" title={Lang.text('support.data.title')} panel={<DataPanel />} />
            </Tabs>
        </Card>
    </Dialog>
);

export default SupportDialog;
