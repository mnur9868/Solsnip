/* PATCH: WarRoom-Intel-Panel#v4.2 ( view~warroom-intel ) */
import { CONFIG } from '../config.js';
import { STATE } from '../state.js';
import { UTILS } from '../utils.js';

const C = CONFIG.COLORS;

export const drawWarRoom = () => {
    UTILS.clear();
    const totalW = process.stdout.columns || 100; 
    const row = STATE.currentRow;
    
    // Header
    console.log(`\n${C.C}╔${"═".repeat(totalW-2)}╗${C.R}`);
    console.log(`${C.C}║${C.R}${UTILS.center(`${C.BG_Err}${C.W_B} ☢  WAR ROOM: LIVE ORDER FLOW  ☢ ${C.R}`, totalW-2)}${C.C}║${C.R}`);
    console.log(`${C.C}╠${"═".repeat(totalW-2)}╣${C.R}`);
    
    // Sub Header
    const target = `TARGET: ${row?.Symbol || 'UNKNOWN'} | PRICE: ${UTILS.formatUSD(row?.Price)}`;
    console.log(`${C.C}║${C.R}${UTILS.center(target, totalW-2)}${C.C}║${C.R}`);
    console.log(`${C.C}╟${"─".repeat(totalW-2)}╢${C.R}`);

    // Columns
    const w = { time: 10, type: 6, price: 12, sol: 10, tokens: 14, usd: 10, maker: 10 };
    const used = w.time + w.type + w.price + w.sol + w.tokens + w.usd + 16;
    w.maker = Math.max(10, totalW - used);

    const head = 
        ` ${UTILS.padRight("TIME", w.time)}│ ${UTILS.padRight("TYPE", w.type)}│ ${UTILS.padRight("PRICE", w.price)}│ ` +
        `${UTILS.padRight("SOL", w.sol)}│ ${UTILS.padRight("TOTAL TOKENS", w.tokens)}│ ` +
        `${UTILS.padRight("USD", w.usd)}│ ${UTILS.padRight("MAKER", w.maker)}`;
    
    console.log(`${C.C}║${C.D}${head}${C.R}${" ".repeat(Math.max(0, totalW - UTILS.strip(head).length - 2))}${C.C}║${C.R}`);
    console.log(`${C.C}╠${"═".repeat(totalW-2)}╣${C.R}`);

    // Data Paginasi & Reverse
    // Log paling baru (array index terakhir) ditampilkan di atas (index visual 0)
    const sortedLogs = [...STATE.warRoomLogs].reverse();
    
    const totalPages = Math.ceil(sortedLogs.length / STATE.warRoomItemsPerPage) || 1;
    if (STATE.warRoomPage >= totalPages) STATE.warRoomPage = totalPages - 1;
    if (STATE.warRoomPage < 0) STATE.warRoomPage = 0;

    const startIdx = STATE.warRoomPage * STATE.warRoomItemsPerPage;
    const visibleLogs = sortedLogs.slice(startIdx, startIdx + STATE.warRoomItemsPerPage);
    
    // --- RENDER ROWS ---
    visibleLogs.forEach((log, i) => {
        const isSel = i === STATE.warRoomIdx; // Cek seleksi
        const color = log.type === 'BUY' ? C.G : C.Err;
        const typeStr = log.type === 'BUY' ? "BUY " : "SELL";
        
        const line = 
            ` ${UTILS.padRight(log.time, w.time)}│ ` +
            `${color}${UTILS.padRight(typeStr, w.type)}${C.R}│ ` +
            `${UTILS.padRight(log.price, w.price)}│ ` +
            `${UTILS.padRight(log.sol, w.sol)}│ ` +
            `${UTILS.padRight(log.tokens, w.tokens)}│ ` +
            `${color}${UTILS.padRight(log.usd, w.usd)}${C.R}│ ` +
            `${C.D}${UTILS.padRight(log.maker, w.maker)}${C.R}`;
            
        const pad = " ".repeat(Math.max(0, totalW - UTILS.strip(line).length - 2));
        
        // Highlight Baris Terpilih
        if (isSel) {
            console.log(`${C.C}║${C.BG_Sel}${C.K}${UTILS.strip(line)}${pad}${C.R}${C.C}║${C.R}`);
        } else {
            console.log(`${C.C}║${C.R}${line}${pad}${C.C}║${C.R}`);
        }
    });

    for(let i = visibleLogs.length; i < STATE.warRoomItemsPerPage; i++) {
        console.log(`${C.C}║${" ".repeat(totalW-2)}║${C.R}`);
    }
    console.log(`${C.C}╚${"═".repeat(totalW-2)}╝${C.R}`);

    // --- TRANSACTION INTEL PANEL (FITUR BARU) ---
    const selLog = visibleLogs[STATE.warRoomIdx];
    if (selLog) {
        const P_Panel = " ".repeat(Math.max(0, Math.floor((totalW - 70) / 2)));
        const BoxW = 70;
        
        console.log(`\n${P_Panel}${C.C}╔${"═".repeat(BoxW)}╗${C.R}`);
        console.log(`${P_Panel}${C.C}║${C.W_B}${UTILS.center("TRANSACTION INTELLIGENCE", BoxW)}${C.R}${C.C}║${C.R}`);
        console.log(`${P_Panel}${C.C}╠${"═".repeat(BoxW)}╣${C.R}`);
        
        const printRow = (l, v) => {
            const label = UTILS.padRight(l, 12);
            const val = UTILS.padRight(v, BoxW - 16);
            console.log(`${P_Panel}${C.C}║${C.D} ${label} :${C.R} ${val} ${C.C}║${C.R}`);
        };

        // Data Simulasi Detail
        printRow("SIGNATURE", selLog.txId || "Analyzing...");
        printRow("MAKER ADDR", selLog.makerFull || "Unknown");
        printRow("BLOCK SLOT", selLog.block || "Pending");
        printRow("PRIO FEE", selLog.fee || "0.000005 SOL");
        
        console.log(`${P_Panel}${C.C}╚${"═".repeat(BoxW)}╝${C.R}`);
    }

    // Footer
    const pageInfo = `PAGE ${STATE.warRoomPage + 1}/${totalPages}`;
    const navHint = `[↑/↓] SELECT TX | [←/→] HISTORY`;
    console.log(UTILS.center(`${C.D}${navHint} | ${pageInfo} | [ESC] BACK${C.R}`, totalW));
};
