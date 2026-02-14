/* MODULE: View-Table */
import { CONFIG } from '../config.js';
import { STATE } from '../state.js';
import { UTILS } from '../utils.js';

const C = CONFIG.COLORS;
const I = CONFIG.ICONS;

export const drawTable = () => {
    UTILS.clear();
    const totalW = process.stdout.columns || 100;
    
    // --- HEADER ---
    let modeLabel = STATE.mode === 'NEW' ? "FRESH MINTS" : STATE.mode;
    const headerText = ` ${I.ROCKET} MONITORING: ${modeLabel} `;
    const filler = "═".repeat(Math.max(0, totalW - UTILS.strip(headerText).length - 2));
    
    console.log(`${C.C}╔${headerText}${filler}╗${C.R}`);
    
    const status = STATE.loading ? `${C.Y}SCANNING..${C.R}` : `${C.G}LIVE${C.R}`;
    const items = `${C.W}${STATE.data.length}${C.R}`;
    const statusLine = ` STATUS: ${status} │ FOUND: ${items} │ UPDATED: ${STATE.lastUpdated || '-'}`;
    const statusPad = " ".repeat(Math.max(0, totalW - UTILS.strip(statusLine).length - 2));

    console.log(`${C.C}║${C.R}${statusLine}${statusPad}${C.C}║${C.R}`);
    
    if (STATE.error) {
        console.log(`${C.C}╠${"═".repeat(totalW - 2)}╣${C.R}`);
        console.log(`${C.C}║${C.R}${UTILS.center(`${C.Err}${I.WARN} ERROR: ${STATE.error}${C.R}`, totalW - 2)}${C.C}║${C.R}`);
        console.log(`${C.C}╚${"═".repeat(totalW - 2)}╝${C.R}`);
        return;
    }

    // --- GRID CALCULATION ---
    const isSol = STATE.mode === 'SOLANA';
    const w = { no: 4, ch: isSol ? 0 : 5, pr: 14, li: 11, fdv: 11, ag: 6 };
    const separatorCount = isSol ? 7 : 8;
    const usedWidth = w.no + w.ch + w.pr + w.li + w.fdv + w.ag + (separatorCount * 3) + 2; 
    const remaining = Math.max(20, totalW - usedWidth);
    w.sy = Math.floor(remaining * 0.30);
    w.nm = Math.floor(remaining * 0.70);

    // Helpers
    const padLeft = (text, len) => {
        const clean = UTILS.strip(text);
        const pad = " ".repeat(Math.max(0, len - clean.length));
        return pad + text;
    };
    const printRow = (c1, c2, c3, c4, c5, c6, c7, c8, bg = "", textC = C.R) => {
        const colChain = isSol ? "" : `│ ${c2} `;
        const line = `│ ${c1} ${colChain}│ ${c3} │ ${c4} │ ${c5} │ ${c6} │ ${c7} │ ${c8} `;
        const pad = " ".repeat(Math.max(0, totalW - UTILS.strip(line).length - 1));
        console.log(`${C.C}║${bg}${textC}${line}${pad}${C.R}${C.C}║${C.R}`);
    };

    console.log(`${C.C}╠${"═".repeat(totalW - 2)}╣${C.R}`);

    // HEADERS
    printRow(
        UTILS.padRight("#", w.no), UTILS.padRight("CHAIN", w.ch), UTILS.padRight("SYMBOL", w.sy),
        UTILS.padRight("PRICE ($)", w.pr), UTILS.padRight("LIQ", w.li), UTILS.padRight("FDV", w.fdv),
        UTILS.padRight("AGE", w.ag), UTILS.padRight("NAME", w.nm), C.BG_Head, C.W_B
    );
    console.log(`${C.C}╟${"─".repeat(totalW - 2)}╢${C.R}`);

    // ROWS
    const startIdx = STATE.tablePage * STATE.itemsPerPage;
    const visible = STATE.data.slice(startIdx, startIdx + STATE.itemsPerPage);

    visible.forEach((item, i) => {
        const isSel = i === STATE.tableIdx;
        const liqColor = item.Liquidity < 1000 ? C.Err : (item.Liquidity > 50000 ? C.G : C.W);
        
        // Data Prep
        const d = {
            no: UTILS.padRight((startIdx + i + 1).toString(), w.no),
            ch: isSol ? "" : UTILS.padRight(item.Chain.substring(0,3).toUpperCase(), w.ch),
            sy: UTILS.padRight(item.Symbol.substring(0, w.sy), w.sy),
            pr: padLeft(UTILS.formatUSD(item.Price), w.pr),
            li: padLeft(`${liqColor}$${UTILS.formatNumber(item.Liquidity)}${C.R}`, w.li),
            liSel: padLeft(`$${UTILS.formatNumber(item.Liquidity)}`, w.li), // No color for selection
            fdv: padLeft(`${C.G}$${UTILS.formatNumber(item.FDV)}${C.R}`, w.fdv),
            fdvSel: padLeft(`$${UTILS.formatNumber(item.FDV)}`, w.fdv),
            ag: UTILS.padRight(UTILS.timeSince(item.Age), w.ag),
            nm: UTILS.padRight(item.Name.substring(0, w.nm), w.nm)
        };

        if (isSel) {
            // Price Left Aligned + Padding inside logic handling
            const pVal = UTILS.formatUSD(item.Price);
            printRow(d.no, d.ch, d.sy, pVal.padStart(w.pr), d.liSel, d.fdvSel, d.ag, d.nm, C.BG_Sel, C.K);
        } else {
            printRow(d.no, d.ch, d.sy, d.pr, d.li, d.fdv, d.ag, d.nm);
        }
    });

    for(let i = visible.length; i < STATE.itemsPerPage; i++) console.log(`${C.C}║${C.R}${" ".repeat(totalW - 2)}${C.C}║${C.R}`);
    console.log(`${C.C}╚${"═".repeat(totalW - 2)}╝${C.R}`);
    console.log(UTILS.center(`${C.D}[←/→] PAGE | [↑/↓] SELECT | [R] REFRESH | [ENTER] ANALYZE | [ESC] BACK${C.R}`, totalW));
};
