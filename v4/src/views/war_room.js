/* PATCH: WarRoom-Full-Dashboard#v4.3 ( view~dashboard-stats ) */
import { CONFIG } from '../config.js';
import { STATE } from '../state.js';
import { UTILS } from '../utils.js';

const C = CONFIG.COLORS;

export const drawWarRoom = () => {
    UTILS.clear();
    const totalW = process.stdout.columns || 100; 
    const row = STATE.currentRow;
    
    // --- 1. HEADER UTAMA ---
    console.log(`\n${C.C}╔${"═".repeat(totalW-2)}╗${C.R}`);
    console.log(`${C.C}║${C.R}${UTILS.center(`${C.BG_Err}${C.W_B} ☢  WAR ROOM: TACTICAL DASHBOARD  ☢ ${C.R}`, totalW-2)}${C.C}║${C.R}`);
    console.log(`${C.C}╠${"═".repeat(totalW-2)}╣${C.R}`);
    
    // --- 2. METRIC DASHBOARD (NEW) ---
    // Baris 1: Informasi Token (Market Data)
    // Layout: PRICE | FDV | LIQ | RATIO
    const colW = Math.floor((totalW - 6) / 4);
    
    const priceStr = UTILS.formatUSD(row.Price);
    const fdvStr = `$${UTILS.formatNumber(row.FDV)}`;
    const liqStr = `$${UTILS.formatNumber(row.Liquidity)}`;
    const ratioStr = row.FDV > 0 ? ((row.Liquidity / row.FDV) * 100).toFixed(1) + "%" : "0%";
    
    const metricLine = 
        `${C.D} PRICE:${C.W_B} ${priceStr.padEnd(colW-7)}` +
        `${C.D}FDV:${C.G} ${fdvStr.padEnd(colW-5)}` +
        `${C.D}LIQ:${C.C} ${liqStr.padEnd(colW-5)}` +
        `${C.D}L/F:${C.M} ${ratioStr}`;
        
    console.log(`${C.C}║${C.R} ${metricLine}${" ".repeat(Math.max(0, totalW - UTILS.strip(metricLine).length - 3))}${C.C}║${C.R}`);
    
    // Baris 2: Informasi On-Chain & Sentiment (Holders & Volume)
    // Layout: HOLDERS | TOP 1% | BUY VOL | SELL VOL
    
    const holdersRaw = STATE.security.holders || [];
    const holderCount = holdersRaw.length > 0 ? "Analyzing.." : "Scanning.."; // Sebenarnya api.js harus fetch total, tapi kita pake length dulu
    const topHolderPct = holdersRaw.length > 0 ? holdersRaw[0].pct.toFixed(2) + "%" : "-%";
    
    // Kalkulasi Bar Sentiment
    const stats = STATE.warRoomStats;
    const totalVol = stats.buyVol + stats.sellVol;
    const buyPct = totalVol > 0 ? (stats.buyVol / totalVol) * 10 : 5; // Scale 10
    const sellPct = 10 - buyPct;
    
    // Visual Bar: [GGGGGRRRR]
    const sentimentBar = `${C.G}${"█".repeat(Math.round(buyPct))}${C.Err}${"█".repeat(Math.round(sellPct))}${C.R}`;
    
    const metricLine2 = 
        `${C.D} TOP 1:${C.W} ${topHolderPct.padEnd(colW-8)}` +
        `${C.D}VOL:${C.R} ${UTILS.formatNumber(stats.sessionVol).padEnd(colW-5)}` +
        `${C.D}SENTIMENT:${C.R} ${sentimentBar}`;

    console.log(`${C.C}║${C.R} ${metricLine2}${" ".repeat(Math.max(0, totalW - UTILS.strip(metricLine2).length - 3))}${C.C}║${C.R}`);
    console.log(`${C.C}╟${"─".repeat(totalW-2)}╢${C.R}`);

    // --- 3. TABLE TRANSACTIONS ---
    const w = { time: 10, type: 6, price: 12, sol: 10, tokens: 14, usd: 10, maker: 10 };
    const used = w.time + w.type + w.price + w.sol + w.tokens + w.usd + 16;
    w.maker = Math.max(10, totalW - used);

    const head = 
        ` ${UTILS.padRight("TIME", w.time)}│ ${UTILS.padRight("TYPE", w.type)}│ ${UTILS.padRight("PRICE", w.price)}│ ` +
        `${UTILS.padRight("SOL", w.sol)}│ ${UTILS.padRight("TOTAL TOKENS", w.tokens)}│ ` +
        `${UTILS.padRight("USD", w.usd)}│ ${UTILS.padRight("MAKER", w.maker)}`;
    
    console.log(`${C.C}║${C.D}${head}${C.R}${" ".repeat(Math.max(0, totalW - UTILS.strip(head).length - 2))}${C.C}║${C.R}`);
    console.log(`${C.C}╠${"═".repeat(totalW-2)}╣${C.R}`);

    // --- 4. RENDER LOGS ---
    const sortedLogs = [...STATE.warRoomLogs].reverse();
    const totalPages = Math.ceil(sortedLogs.length / STATE.warRoomItemsPerPage) || 1;
    
    // Safety check page
    if (STATE.warRoomPage >= totalPages) STATE.warRoomPage = Math.max(0, totalPages - 1);

    const startIdx = STATE.warRoomPage * STATE.warRoomItemsPerPage;
    const visibleLogs = sortedLogs.slice(startIdx, startIdx + STATE.warRoomItemsPerPage);
    
    visibleLogs.forEach((log, i) => {
        const isSel = i === STATE.warRoomIdx; 
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

    // --- 5. TRANSACTION INTEL PANEL ---
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

        printRow("SIGNATURE", selLog.txId || "Analyzing...");
        printRow("MAKER ADDR", selLog.makerFull || "Unknown");
        printRow("BLOCK SLOT", selLog.block || "Pending");
        printRow("PRIO FEE", selLog.fee || "0.000005 SOL");
        
        console.log(`${P_Panel}${C.C}╚${"═".repeat(BoxW)}╝${C.R}`);
    }

    // Footer
    const pageInfo = `PAGE ${STATE.warRoomPage + 1}/${totalPages}`;
    const navHint = `[↑/↓] SELECT | [←/→] HISTORY`;
    console.log(UTILS.center(`${C.D}${navHint} | ${pageInfo} | [ESC] BACK${C.R}`, totalW));
};
