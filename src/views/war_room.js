/* PATCH: WarRoom-RealtimeHolders#v5.6 ( view~warroom-real-holders ) */
import { CONFIG } from '../config.js';
import { STATE } from '../state.js';
import { UTILS } from '../utils.js';

const C = CONFIG.COLORS;
const I = CONFIG.ICONS;

export const drawWarRoom = () => {
    UTILS.clear();
    const totalW = process.stdout.columns || 100; 
    const row = STATE.currentRow;
    const stats = STATE.warRoomStats;
    
    // --- 1. FULL WIDTH ---
    const boxW = totalW; 
    const innerW = boxW - 2;
    // ... (Helpers sama seperti v5.5) ...

    const drawTop = () => console.log(`${C.C}╔${"═".repeat(innerW)}╗${C.R}`);
    const drawDiv = () => console.log(`${C.C}╟${"─".repeat(innerW)}╢${C.R}`);
    const drawBot = () => console.log(`${C.C}╚${"═".repeat(innerW)}╝${C.R}`);

    const printCentered = (text, bg = "") => {
        const clean = UTILS.strip(text);
        const gap = Math.max(0, innerW - clean.length);
        const pl = Math.floor(gap / 2);
        const pr = gap - pl;
        console.log(`${C.C}║${bg}${C.R}${" ".repeat(pl)}${text}${" ".repeat(pr)}${C.C}║${C.R}`);
    };

    const printMetricGrid = (cols) => {
        const count = cols.length;
        const colW = Math.floor(innerW / count);
        let line = "";
        cols.forEach((col, idx) => {
            const isLast = idx === count - 1;
            const currentW = isLast ? (innerW - UTILS.strip(line).length) : colW;
            const clean = UTILS.strip(String(col.text));
            const gap = Math.max(0, currentW - clean.length);
            const pl = Math.floor(gap / 2);
            const pr = gap - pl;
            const separator = isLast ? "" : `${C.C}│${C.R}`;
            line += `${col.color || C.R}${" ".repeat(pl)}${col.text}${" ".repeat(pr)}${C.R}${separator}`;
        });
        console.log(`${C.C}║${C.R}${line}${C.C}║${C.R}`);
    };

    // --- RENDER START ---
    drawTop();
    printCentered(`${C.BG_Err}${C.W} ☢  WAR ROOM: TACTICAL DASHBOARD  ☢ ${C.R}`);
    printCentered(`TARGET: ${row?.Symbol} (${UTILS.truncate(row?.Address, 24)})`, C.D);
    drawDiv();

    // METRICS ROW 1
    const ratioStr = row.FDV > 0 ? ((row.Liquidity / row.FDV) * 100).toFixed(1) + "%" : "0%";
    printMetricGrid([{ text: "PRICE", color: C.D }, { text: "LIQUIDITY", color: C.D }, { text: "FDV", color: C.D }, { text: "L/F RATIO", color: C.D }]);
    printMetricGrid([
        { text: UTILS.formatUSD(row.Price), color: C.W },
        { text: `$${UTILS.formatNumber(row.Liquidity)}`, color: C.C },
        { text: `$${UTILS.formatNumber(row.FDV)}`, color: C.G },
        { text: ratioStr, color: C.M }
    ]);
    drawDiv();

    // METRICS ROW 2
    const totalVol = stats.buyVol + stats.sellVol;
    const buyPct = totalVol > 0 ? (stats.buyVol / totalVol) * 10 : 5; 
    const sentimentBar = `${C.G}${"█".repeat(Math.round(buyPct))}${C.Err}${"█".repeat(10-Math.round(buyPct))}${C.R}`;
    
    // --- UPDATED HOLDERS DISPLAY ---
    // Sekarang mengambil dari STATE.security.totalHolders yang di-fetch secara async
    const holdersDisplay = STATE.security.totalHolders || "Scanning..";

    printMetricGrid([{ text: "ON-CHAIN HOLDERS", color: C.D }, { text: "TX BUY", color: C.D }, { text: "TX SELL", color: C.D }, { text: "SENTIMENT", color: C.D }]);
    printMetricGrid([
        { text: holdersDisplay, color: C.W }, // <--- UPDATED
        { text: `${stats.buyCount}`, color: C.G },
        { text: `${stats.sellCount}`, color: C.Err },
        { text: sentimentBar, color: C.R }
    ]);

    // WARNINGS
    const topHolderPct = STATE.security.holders.length > 0 ? STATE.security.holders[0].pct : 0;
    const isLowLiq = row.Liquidity < 10000;
    const isWhale = topHolderPct > 15;
    if (isLowLiq || isWhale) {
        drawDiv();
        if (isLowLiq) printCentered(`${C.Y}${I.WARN} WARNING: LOW LIQUIDITY (<$10K)${C.R}`, C.BG_Err);
        if (isWhale) printCentered(`${C.Y}${I.WARN} DANGER: WHALE DETECTED (${topHolderPct.toFixed(2)}% Owned)${C.R}`, C.BG_Err);
    }
    drawDiv();

    // --- TABLE ENGINE ---
    const sortedLogs = [...STATE.warRoomLogs].reverse();
    const totalPages = Math.ceil(sortedLogs.length / STATE.warRoomItemsPerPage) || 1;
    if (STATE.warRoomPage >= totalPages) STATE.warRoomPage = Math.max(0, totalPages - 1);
    const startIdx = STATE.warRoomPage * STATE.warRoomItemsPerPage;
    const visibleLogs = sortedLogs.slice(startIdx, startIdx + STATE.warRoomItemsPerPage);

    const w = { time: 8, cls: 2, type: 4, price: 10, sol: 6, tokens: 6, usd: 6, maker: 10 };

    visibleLogs.forEach(log => {
        w.time = Math.max(w.time, log.time.length);
        w.price = Math.max(w.price, log.price.replace('$', '').length);
        w.sol = Math.max(w.sol, log.sol.replace(' ◎', '').length);
        w.tokens = Math.max(w.tokens, log.tokens.length);
        w.usd = Math.max(w.usd, log.usd.length);
        w.maker = Math.max(w.maker, log.maker.length);
    });

    Object.keys(w).forEach(k => w[k] += 2);
    const totalCols = w.time + w.cls + w.type + w.price + w.sol + w.tokens + w.usd + w.maker;
    const separators = 7; 
    const remaining = innerW - totalCols - separators;
    if (remaining > 0) w.maker += remaining;

    const printTableRow = (d, colors = {}, bg = "") => {
        const fmt = (text, width) => {
            const str = UTILS.strip(String(text)).substring(0, width); 
            const gap = Math.max(0, width - str.length);
            const pl = Math.floor(gap / 2); 
            return " ".repeat(pl) + str + " ".repeat(gap - pl);
        };

        const col = (key, width) => `${colors[key] || C.R}${fmt(d[key], width)}${C.R}`;
        const sep = `${C.D}│${C.R}`; 

        const line = 
            col('time', w.time) + sep +
            col('cls', w.cls) + sep +
            col('type', w.type) + sep +
            col('price', w.price) + sep +
            col('sol', w.sol) + sep +
            col('tokens', w.tokens) + sep +
            col('usd', w.usd) + sep +
            col('maker', w.maker);

        console.log(`${C.C}║${bg}${C.R}${line}${C.C}║${C.R}`);
    };

    printTableRow({
        time: "TIME", cls: "CL", type: "TYPE", price: "PRICE", sol: "SOL", tokens: "TOKENS", usd: "USD", maker: "MAKER"
    }, {
        time: C.D, cls: C.D, type: C.D, price: C.D, sol: C.D, tokens: C.D, usd: C.D, maker: C.D
    });
    drawDiv();

    visibleLogs.forEach((log, i) => {
        const isSel = i === STATE.warRoomIdx;
        const isBuy = log.type === 'BUY';
        const color = isBuy ? C.G : C.Err;

        const valRaw = log.usd ? log.usd.replace(/[$,]/g, '') : "0";
        const usdVal = parseFloat(valRaw);
        let icon = "🦐";
        if (usdVal >= 1000) icon = "🐋";
        else if (usdVal >= 500) icon = "🦈";
        else if (usdVal >= 200) icon = "🐙";
        else if (usdVal >= 100) icon = "🐟";

        const rowData = {
            time: log.time, cls: icon, type: isBuy ? "BUY" : "SELL",
            price: log.price.replace('$', ''),
            sol: log.sol.replace(' ◎', ''),
            tokens: log.tokens,
            usd: log.usd,
            maker: log.maker
        };
        const colMap = { time: C.D, cls: C.W, type: color, price: C.W, sol: C.W, tokens: C.D, usd: color, maker: C.D };
        printTableRow(rowData, colMap, isSel ? C.BG_Sel : "");
    });

    for(let i = visibleLogs.length; i < STATE.warRoomItemsPerPage; i++) {
        console.log(`${C.C}║${" ".repeat(innerW)}║${C.R}`);
    }
    drawBot();

    const selLog = visibleLogs[STATE.warRoomIdx];
    if (selLog) {
        console.log(`${C.C}╔${"═".repeat(innerW)}╗${C.R}`);
        printCentered(`TRANSACTION INTEL: ${selLog.txId}`, C.D);
        drawDiv();
        const info = (k, v) => {
            const l = UTILS.padRight(k, 12);
            console.log(`${C.C}║${C.D} ${l}: ${C.W}${v}${" ".repeat(Math.max(0, innerW - 16 - UTILS.strip(v).length))}${C.C}║${C.R}`);
        };
        info("MAKER ADDR", selLog.makerFull || "Unknown");
        info("BLOCK SLOT", selLog.block || "Pending");
        info("PRIO FEE", selLog.fee || "0.000005 SOL");
        drawBot();
    }

    const pageInfo = `PAGE ${STATE.warRoomPage + 1}/${totalPages}`;
    const navHint = `[↑/↓] SELECT | [←/→] HISTORY`;
    console.log(UTILS.center(`${C.D}${navHint} | ${pageInfo} | [ESC] BACK${C.R}`, totalW));
};
