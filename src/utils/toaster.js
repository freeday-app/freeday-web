import { Position, Toaster } from '@blueprintjs/core';

export const ToasterTimeout = {
    NOTIMEOUT: null,
    LONG: 10000
};

export default Toaster.create({
    className: 'recipe-toaster',
    position: Position.BOTTOM_RIGHT
});
