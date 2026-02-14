/* PATCH: WarRoom-Pagination-Tokens#v4.1 ( view~warroom-upgrade ) */
import { CONFIG } from '../config.js';
import { STATE } from '../state.js';
import { UTILS } from '../utils.js';

const C = CONFIG.COLORS;

export const drawWarRoom = () => {
    UTILS.clear();
    const totalW = process.stdout.columns || 100; // Lebar minimal agar muat kolom baru
    const row = STATE.currentRow;
    
    // Header
    console.log(`\n${C.C}╔${"═".repeat(totalW-2)}╗${C.R}`);
    console.log(`${C.C}║${C.R}${UTILS.center(`${C.BG_Err}${C.W_B} ☢  WAR ROOM: LIVE ORDER FLOW  ☢ ${C.R}`, totalW-2)}${C.C}║${C.R}`);
    console.log(`${C.C}╠${"═".repeat(totalW-2)}╣${C.R}`);
    
    // Sub Header
    const target = `TARGET: ${row?.Symbol || 'UNKNOWN'} | PRICE: ${UTILS.formatUSD(row?.Price)}`;
    console.log(`${C.C}║${C.R}${UTILS.center(target, totalW-2)}${C.C}║${C.R}`);
    console.log(`${C.C}╟${"─".repeat(totalW-2)}╢${C.R}`);

    // --- TABLE COLUMN DEFINITION ---
    // Kolom baru: TOKENS
    const w = { time: 10, type: 6, price: 12, sol: 10, tokens: 14, usd: 10, maker: 10 };
    
    // Hitung sisa space untuk Maker
    const used = w.time + w.type + w.price + w.sol + w.tokens + w.usd + 16; // 16 = borders & spaces
    w.maker = Math.max(10, totalW - used);

    const head = 
        ` ${UTILS.padRight("TIME", w.time)}│ ${UTILS.padRight("TYPE", w.type)}│ ${UTILS.padRight("PRICE", w.price)}│ ` +
        `${UTILS.padRight("SOL", w.sol)}│ ${UTILS.padRight("TOTAL TOKENS", w.tokens)}│ ` +
        `${UTILS.padRight("USD", w.usd)}│ ${UTILS.padRight("MAKER", w.maker)}`;
    
    console.log(`${C.C}║${C.D}${head}${C.R}${" ".repeat(Math.max(0, totalW - UTILS.strip(head).length - 2))}${C.C}║${C.R}`);
    console.log(`${C.C}╠${"═".repeat(totalW-2)}╣${C.R}`);

    // --- PAGINATION LOGIC ---
    // Log terbaru ada di paling bawah array (push), tapi untuk display kita ingin yang terbaru di atas?
    // Biasanya terminal log: terbaru di bawah. Tapi paginasi table: terbaru di halaman 1.
    // Kita balik arraynya agar index 0 adalah yang terbaru untuk keperluan display
    const sortedLogs = [...STATE.warRoomLogs].reverse();
    
    const totalPages = Math.ceil(sortedLogs.length / STATE.warRoomItemsPerPage) || 1;
    // Pastikan page valid
    if (STATE.warRoomPage >= totalPages) STATE.warRoomPage = totalPages - 1;
    if (STATE.warRoomPage < 0) STATE.warRoomPage = 0;

    const startIdx = STATE.warRoomPage * STATE.warRoomItemsPerPage;
    const visibleLogs = sortedLogs.slice(startIdx, startIdx + STATE.warRoomItemsPerPage);
    
    visibleLogs.forEach(log => {
        const color = log.type === 'BUY' ? C.G : C.Err;
        const typeStr = log.type === 'BUY' ? "BUY " : "SELL";
        
        const line = 
            ` ${UTILS.padRight(log.time, w.time)}│ ` +
            `${color}${UTILS.padRight(typeStr, w.type)}${C.R}│ ` +
            `${UTILS.padRight(log.price, w.price)}│ ` +
            `${UTILS.padRight(log.sol, w.sol)}│ ` +
            `${UTILS.padRight(log.tokens, w.tokens)}│ ` +  // Kolom Baru
            `${color}${UTILS.padRight(log.usd, w.usd)}${C.R}│ ` +
            `${C.D}${UTILS.padRight(log.maker, w.maker)}${C.R}`;
            
        const pad = " ".repeat(Math.max(0, totalW - UTILS.strip(line).length - 2));
        console.log(`${C.C}║${C.R}${line}${pad}${C.C}║${C.R}`);
    });

    // Fill empty rows to keep height consistent
    for(let i = visibleLogs.length; i < STATE.warRoomItemsPerPage; i++) {
        console.log(`${C.C}║${" ".repeat(totalW-2)}║${C.R}`);
    }

    console.log(`${C.C}╚${"═".repeat(totalW-2)}╝${C.R}`);
    
    // Footer Controls
    const pageInfo = `PAGE ${STATE.warRoomPage + 1}/${totalPages}`;
    const navHint = totalPages > 1 ? `[←/→] NAVIGATE HISTORY | ` : ``;
    console.log(UTILS.center(`${C.D}${navHint}${pageInfo} | [ESC] BACK TO DETAILS${C.R}`, totalW));
};
