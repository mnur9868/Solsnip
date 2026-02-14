/* PATCH: Details-Footer-Update#v4.2 ( view~details-footer-w ) */
import { CONFIG } from '../config.js';
import { STATE } from '../state.js';
import { UTILS } from '../utils.js';
import { DATA_SERVICE } from '../api.js';

const C = CONFIG.COLORS;
const I = CONFIG.ICONS;

export const drawDetails = () => {
    UTILS.clear();
    const row = STATE.currentRow; if (!row) return;
    const totalW = process.stdout.columns || 80;
    const W = 78; 
    const P = " ".repeat(Math.max(0, Math.floor((totalW - W) / 2)));
    
    const analysis = DATA_SERVICE.analyzeToken(row);

    // Scoring & Grade
    let grade = 'F'; 
    if (analysis.score >= 90) grade = 'S'; 
    else if (analysis.score >= 80) grade = 'A'; 
    else if (analysis.score >= 65) grade = 'B'; 
    else if (analysis.score >= 50) grade = 'C'; 
    else if (analysis.score >= 30) grade = 'D';
    const gradeColor = grade === 'S' || grade === 'A' ? C.G : (grade === 'F' ? C.Err : C.Y);
    
    // Helpers
    const drawBar = (pct, len = 10, fillC = C.G, emptyC = C.D) => {
        const filledLen = Math.round((pct / 100) * len);
        const filled = "█".repeat(filledLen);
        const empty = "░".repeat(Math.max(0, len - filledLen));
        return `${fillC}${filled}${C.R}${emptyC}${empty}${C.R}`;
    };
    const printLine = (str) => {
        const clean = UTILS.strip(str);
        console.log(`${P}${C.C}║${C.R} ${str}${" ".repeat(Math.max(0, W - 2 - clean.length))}${C.C}║${C.R}`);
    };
    const printCenter = (str, bg = "") => console.log(`${P}${C.C}║${bg}${UTILS.center(str, W - 2)}${C.R}${C.C}║${C.R}`);
    const divider = () => console.log(`${P}${C.C}╠${"═".repeat(W-2)}╣${C.R}`);

    // --- RENDER START ---
    console.log(`\n${P}${C.C}╔${"═".repeat(W-2)}╗${C.R}`);
    printCenter(`${C.W_B}${I.EYE} TARGET: ${row.Name} (${row.Symbol})`, C.BG_Warn);
    divider();

    printCenter(`${C.D}CONTRACT ADDRESS (DOUBLE CLICK TO COPY):${C.R}`);
    printCenter(`${C.C_B}${row.Address}${C.R}`);
    divider();

    // Metrics Grid
    const c1 = 17, c2 = 18, c3 = 18, c4 = 17;
    printLine(`${C.D}${UTILS.padRight("PRICE USD", c1)}│ ${UTILS.padRight("LIQUIDITY", c2)}│ ${UTILS.padRight("FDV (MCAP)", c3)}│ ${UTILS.padRight("LIQ/FDV", c4)}${C.R}`);

    const buildCol = (val, w, color) => {
        const clean = UTILS.strip(String(val));
        const pad = " ".repeat(Math.max(0, w - clean.length));
        return `${color}${val}${C.R}${pad}`;
    };
    const ratioStr = row.FDV > 0 ? ((row.Liquidity / row.FDV) * 100).toFixed(1) + "%" : "0%";
    
    printLine(
        buildCol(UTILS.formatUSD(row.Price || 0), c1, C.W) + `│ ` + 
        buildCol(`$${UTILS.formatNumber(row.Liquidity || 0)}`, c2, C.C) + `│ ` + 
        buildCol(`$${UTILS.formatNumber(row.FDV || 0)}`, c3, C.G) + `│ ` + 
        buildCol(ratioStr, c4, C.M)
    );
    divider();

    // Info Split
    const half = Math.floor((W - 6) / 2);
    const printSplit = (k1, v1, k2, v2) => {
        const left = `${C.D}${UTILS.padRight(k1, 8)}:${C.R} ${UTILS.padRight(v1, half - 9)}`;
        const right = `${C.D}${UTILS.padRight(k2, 8)}:${C.R} ${v2}`;
        printLine(`${left}│ ${right}`);
    };
    
    const mintStat = STATE.security.mintAuth ? `${C.Err}DANGR` : `${C.G}SAFE`;
    const frzStat = STATE.security.freezeAuth ? `${C.Err}DANGR` : `${C.G}SAFE`;

    printSplit("AGE", UTILS.timeSince(row.Age), "GRADE", `[ ${gradeColor}${grade}${C.R} ] ${analysis.riskLevel}`);
    printSplit("CHAIN", row.Chain.toUpperCase(), "SCORE", `${drawBar(analysis.score, 10, analysis.riskColor)} ${analysis.score}`);
    printSplit("DEX", (row.Dex||"UNK").toUpperCase(), "MINT", mintStat);
    printSplit("TYPE", (row.Type||"SPOT").toUpperCase(), "FREEZ", frzStat);
    divider();

    if (analysis.warnings.length) {
        printCenter(UTILS.padRight(` ${I.WARN} CAUTION: ${analysis.warnings.join(", ")}`, W-2), C.BG_Sel);
        divider();
    }

    // Holders
    printLine(`${C.G_B}TOP HOLDERS DISTRIBUTION${C.R}`);
    if (STATE.security.loading) printLine(`${C.D}Scanning blockchain data...${C.R}`);
    else {
        STATE.security.holders.forEach((h, i) => {
            const pctVal = h.pct || 0;
            const bar = drawBar(pctVal, W - 25, C.C, "\x1b[2m▒");
            printLine(` #${(i+1).toString().padEnd(2)} ${h.address.substring(0,4)}..${h.address.slice(-4).padEnd(5)} ${bar} ${pctVal.toFixed(2)}%`);
        });
    }
    divider();

    // Enhanced Project Channels
    printLine(`${C.G_B}PROJECT SOCIALS & LINKS${C.R}`);
    const socLink = (i, l, u) => printLine(` ${i} ${C.C}${UTILS.padRight(l, 12)}${C.R}: ${C.D}${UTILS.truncate(u, W - 20)}${C.R}`);
    if (row.Websites?.length) row.Websites.forEach(w => socLink("🌐", "WEBSITE", w.url));
    if (row.Socials?.length) row.Socials.forEach(s => {
        let icon = "💬", label = s.type.toUpperCase();
        if (s.type === 'twitter') { icon = "🐦"; label = "TWITTER"; } 
        if (s.type === 'telegram') { icon = "✈️"; label = "TELEGRAM"; }
        socLink(icon, label, s.url);
    });
    
    if ((row.Websites?.length || 0) + (row.Socials?.length || 0) > 0) printLine(`${C.D}${"-".repeat(W-4)}${C.R}`);

    const termLink = (i, l, u) => printLine(` ${i} ${C.Err}${UTILS.padRight(l, 12)}${C.R}: ${C.D}${UTILS.truncate(u, W - 20)}${C.R}`);
    termLink("🦅", "DEXSCREENER", row.Url);
    termLink("🔍", "SOLSCAN", `https://solscan.io/token/${row.Address}`);
    termLink("⚡", "PHOTON", `https://photon-sol.tinyastro.io/en/lp/${row.Address}`);
    termLink("💠", "RAYDIUM", `https://raydium.io/swap/?outputCurrency=${row.Address}`);

    console.log(`${P}${C.C}╚${"═".repeat(W-2)}╝${C.R}`);
    
    // FOOTER DENGAN INSTRUKSI WAR ROOM [W]
    const btn = (t, b) => `${b} ${C.K}${t} ${C.R}`;
    const footerText = btn("[ESC] BACK", C.BG_Warn) + " " + 
                       btn("[R] REFRESH", C.BG_Warn) + " " + 
                       btn("[W] WAR ROOM", "\x1b[45m") + " " + // Tombol Baru Magenta
                       btn("[C] COPY", C.BG_Err) + " " + 
                       btn("[B] BUY", "\x1b[44m");
    
    console.log(`${P}${UTILS.center(footerText, W)}`);
};
