/* PATCH: Menu-Wallet-Display#v4.0 ( view~menu-with-balance ) */
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
    console.log(`${P}${C.C}║${C.R}${UTILS.center(`${C.W_B}⚡  SOLANA WAR ROOM v4.0  ⚡${C.R}`, w-2)}${C.C}║${C.R}`);
    console.log(`${P}${C.C}╠${line}╣${C.R}`);
    
    const rpcColor = STATE.rpcStatus.includes("ONLINE") ? C.G : C.Err;
    
    // --- UPDATE: TAMPILKAN SALDO ---
    const balVal = STATE.wallet.balance.toFixed(4);
    const walletTxt = STATE.wallet.address ? `BAL: ${C.G}${balVal} SOL${C.R}` : `${C.D}No Wallet${C.R}`;
    
    const sysInfo = `RPC: ${rpcColor}●${C.R}  |  ${walletTxt}`;
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
