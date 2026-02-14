/* MODULE: View-Menu */
import { CONFIG } from '../config.js';
import { STATE } from '../state.js';
import { UTILS } from '../utils.js';

const C = CONFIG.COLORS;

export const drawMenu = () => {
    UTILS.clear();
    const w = 60; 
    const totalW = process.stdout.columns || 80;
    const P = " ".repeat(Math.max(0, Math.floor((totalW - w) / 2)));
    const line = "═".repeat(w - 2);

    console.log("\n".repeat(2));
    console.log(`${P}${C.C}╔${line}╗${C.R}`);
    console.log(`${P}${C.C}║${C.R}${UTILS.center(`${C.W_B}⚡  SOLANA WAR ROOM v3.0  ⚡${C.R}`, w-2)}${C.C}║${C.R}`);
    console.log(`${P}${C.C}╠${line}╣${C.R}`);
    
    const rpcColor = STATE.rpcStatus.includes("ONLINE") ? C.G : C.Err;
    const sysInfo = `RPC: ${rpcColor}●${C.R}  |  MODE: ${C.W}${STATE.mode || 'IDLE'}${C.R}`;
    console.log(`${P}${C.C}║${C.R}${UTILS.center(sysInfo, w - 2)}${C.C}║${C.R}`);
    console.log(`${P}${C.C}╟${"─".repeat(w-2)}╢${C.R}`);

    CONFIG.MENUS.forEach((item, idx) => {
        const isSel = idx === STATE.menuIdx;
        if (isSel) {
            console.log(`${P}${C.C}║${C.BG_Sel}${UTILS.center(item.name, w-2)}${C.R}${C.C}║${C.R}`);
            console.log(`${P}${C.C}║${C.R}${UTILS.center(`${C.D}└─ ${item.desc}${C.R}`, w-2)}${C.C}║${C.R}`);
        } else {
            console.log(`${P}${C.C}║${C.R}${UTILS.center(item.name, w-2)}${C.C}║${C.R}`);
        }
    });

    console.log(`${P}${C.C}╚${line}╝${C.R}`);
    console.log(`\n${UTILS.center(`${C.D}Use [↑/↓] to Navigate  •  [ENTER] to Initialize${C.R}`, totalW)}`);
};
