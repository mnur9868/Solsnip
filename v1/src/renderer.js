/* PATCH: Modular-Architecture#v3.0 ( renderer~main-router ) */
import { STATE } from './state.js';
import { drawMenu } from './views/menu.js';
import { drawInput } from './views/input.js';
import { drawTable } from './views/table.js';
import { drawDetails } from './views/details.js';

export const RENDERER = {
    draw: () => {
        // Router Sederhana
        switch (STATE.view) {
            case 'MENU':    return drawMenu();
            case 'INPUT':   return drawInput();
            case 'TABLE':   return drawTable();
            case 'DETAILS': return drawDetails();
            default:        return drawMenu(); // Fallback
        }
    }
};
