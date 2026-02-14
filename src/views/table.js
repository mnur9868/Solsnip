/* PATCH: Compact-Centered-Table#v4.5 ( view~table-polish ) */
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

    // --- SMART COLUMN SIZING ---
    const startIdx = STATE.tablePage * STATE.itemsPerPage;
    const visible = STATE.data.slice(startIdx, startIdx + STATE.itemsPerPage);
    const isSol = STATE.mode === 'SOLANA';

    // 1. Definisikan Kolom & Alignment
    // align: 'center' | 'left' | 'right'
    const cols = [
        { id: 'no',  label: '#',        align: 'center' }, 
        { id: 'ch',  label: 'CHAIN',    hide: isSol, align: 'center' },
        { id: 'sy',  label: 'SYMBOL',   align: 'left' },   // Symbol tetap kiri biar rapi
        { id: 'pr',  label: 'PRICE ($)',align: 'center' }, // Request User: Center
        { id: 'li',  label: 'LIQ',      align: 'center' }, // Request User: Center
        { id: 'fdv', label: 'FDV',      align: 'center' }, // Request User: Center
        { id: 'ag',  label: 'AGE',      align: 'center' }, // Request User: Center
        { id: 'nm',  label: 'NAME',     flex: true, align: 'left' }
    ];

    // 2. Hitung Lebar Minimum (Auto-Fit)
    const w = {};
    cols.forEach(c => {
        if (c.hide) { w[c.id] = 0; return; }
        let maxLen = c.label.length;
        
        visible.forEach((item, i) => {
            let val = "";
            if (c.id === 'no') val = (startIdx + i + 1).toString();
            if (c.id === 'ch') val = item.Chain.substring(0,3).toUpperCase();
            if (c.id === 'sy') val = item.Symbol;
            if (c.id === 'pr') val = UTILS.formatUSD(item.Price);
            if (c.id === 'li') val = `$${UTILS.formatNumber(item.Liquidity)}`;
            if (c.id === 'fdv') val = `$${UTILS.formatNumber(item.FDV)}`;
            if (c.id === 'ag') val = UTILS.timeSince(item.Age);
            
            if (val.length > maxLen) maxLen = val.length;
        });

        // Compact Logic: Padding hanya +2 (1 kiri, 1 kanan)
        w[c.id] = maxLen + 2; 
    });

    // 3. Hitung Flex Column (Name)
    const activeCols = cols.filter(c => !c.hide);
    // Border space = (jumlah kolom aktif * 1 char border) + 1 char closing border
    // Kita pakai separator "│" (1 char) antar kolom
    const borderSpace = activeCols.length + 1; 
    const usedWidth = activeCols.reduce((acc, c) => acc + (c.flex ? 0 : w[c.id]), 0);
    const remaining = Math.max(10, totalW - usedWidth - borderSpace);
    w['nm'] = remaining;

    // --- RENDER HELPERS ---
    
    // Fungsi format cell berdasarkan alignment kolom
    const formatCell = (text, colId, width) => {
        const colDef = cols.find(c => c.id === colId);
        const align = colDef ? colDef.align : 'left';
        
        if (align === 'center') return UTILS.center(text, width);
        if (align === 'right') {
            const clean = UTILS.strip(text);
            return " ".repeat(Math.max(0, width - clean.length)) + text;
        }
        // Default Left
        return UTILS.padRight(text, width);
    };
    
    const printRow = (cells, bg = "", textC = C.R) => {
        let line = "";
        activeCols.forEach(c => {
            const val = cells[c.id];
            // Render cell dengan alignment yang sesuai
            const cellStr = formatCell(val, c.id, w[c.id]);
            line += `│${cellStr}`; // Separator lebih rapat (tanpa spasi tambahan setelah |)
        });
        
        // Tutup border kanan
        line += "│";
        
        // Isi sisa kanan terminal jika ada (karena pembulatan width)
        const pad = " ".repeat(Math.max(0, totalW - UTILS.strip(line).length));
        console.log(`${C.C}${bg}${textC}${line}${pad}${C.R}`);
    };

    console.log(`${C.C}╠${"═".repeat(totalW - 2)}╣${C.R}`);

    // --- RENDER HEADER ---
    const headerCells = {};
    cols.forEach(c => headerCells[c.id] = c.label);
    // Header menggunakan BG_Head
    printRow(headerCells, C.BG_Head, C.W_B);
    console.log(`${C.C}╟${"─".repeat(totalW - 2)}╢${C.R}`);

    // --- RENDER DATA ---
    visible.forEach((item, i) => {
        const isSel = i === STATE.tableIdx;
        const liqColor = item.Liquidity < 1000 ? C.Err : (item.Liquidity > 50000 ? C.G : C.W);

        const vals = {
            no: (startIdx + i + 1).toString(),
            ch: isSol ? "" : item.Chain.substring(0,3).toUpperCase(),
            sy: item.Symbol.substring(0, w.sy - 2), // trim agar fit padding
            pr: UTILS.formatUSD(item.Price),
            li: `$${UTILS.formatNumber(item.Liquidity)}`,
            fdv: `$${UTILS.formatNumber(item.FDV)}`,
            ag: UTILS.timeSince(item.Age),
            nm: item.Name.substring(0, w.nm - 2)
        };

        if (isSel) {
            printRow(vals, C.BG_Sel, C.K);
        } else {
            const colorVals = { ...vals };
            // Warnai angka saja, alignment diurus formatCell
            colorVals.li = `${liqColor}${vals.li}${C.R}`;
            colorVals.fdv = `${C.G}${vals.fdv}${C.R}`;
            printRow(colorVals);
        }
    });

    // Fill Empty Rows
    for(let i = visible.length; i < STATE.itemsPerPage; i++) {
        // Render baris kosong dengan border vertikal agar grid tetap utuh
        let emptyLine = "";
        activeCols.forEach(c => emptyLine += `│${" ".repeat(w[c.id])}`);
        emptyLine += "│";
        const pad = " ".repeat(Math.max(0, totalW - UTILS.strip(emptyLine).length));
        console.log(`${C.C}${emptyLine}${pad}${C.R}`);
    }
    
    console.log(`${C.C}╚${"═".repeat(totalW - 2)}╝${C.R}`);
    console.log(UTILS.center(`${C.D}[←/→] PAGE | [↑/↓] SELECT | [R] REFRESH | [ENTER] ANALYZE | [ESC] BACK${C.R}`, totalW));
};
