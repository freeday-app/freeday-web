import React from 'react';
import Lang from '../utils/language.js';
import packageJson from '../../package.json';

import '../css/footer.css';

const Footer = () => (
    <footer id="footer" className="footer">
        <div className="footer-content">
            {Lang.text('footer.text').replace('%s', '')}
            <a
                className="footer-link"
                href="https://www.coddity.com/"
                target="_blank"
                rel="noopener noreferrer"
            >
                {`${Lang.text('footer.brand')} - v${packageJson.version}`}
            </a>
        </div>
    </footer>
);

export default Footer;
