/* PATCH: Renderer-WarRoom#v4.0 ( renderer~register-warroom ) */
import { STATE } from './state.js';
import { drawMenu } from './views/menu.js';
import { drawInput } from './views/input.js';
import { drawTable } from './views/table.js';
import { drawDetails } from './views/details.js';
import { drawWarRoom } from './views/war_room.js'; // Import baru

export const RENDERER = {
    draw: () => {
        switch (STATE.view) {
            case 'MENU':    return drawMenu();
            case 'INPUT':   return drawInput();
            case 'TABLE':   return drawTable();
            case 'DETAILS': return drawDetails();
            case 'WAR_ROOM': return drawWarRoom(); // Case baru
            default:        return drawMenu();
        }
    }
};