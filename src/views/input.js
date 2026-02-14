/* PATCH: Grid-Input-Scanner#v5.0 ( view~input-grid-system ) */
import { CONFIG } from '../config.js';
import { STATE } from '../state.js';
import { UTILS } from '../utils.js';

const C = CONFIG.COLORS;
const I = CONFIG.ICONS;

export const drawInput = () => {
    UTILS.clear();
    const totalW = process.stdout.columns || 80;
    
    // --- 1. DYNAMIC WIDTH CALCULATION ---
    // Lebar konsisten dengan Details View (Min 64, Max 100)
    const boxW = Math.max(64, Math.min(100, totalW - 2));
    const P = " ".repeat(Math.max(0, Math.floor((totalW - boxW) / 2)));
    const innerW = boxW - 2;

    // --- 2. DRAWING HELPERS ---
    const drawTop = () => console.log(`${P}${C.C}╔${"═".repeat(innerW)}╗${C.R}`);
    const drawMid = () => console.log(`${P}${C.C}╠${"═".repeat(innerW)}╣${C.R}`);
    const drawBot = () => console.log(`${P}${C.C}╚${"═".repeat(innerW)}╝${C.R}`);
    const drawDiv = () => console.log(`${P}${C.C}╟${"─".repeat(innerW)}╢${C.R}`);

    const printRow = (text, align = 'left', color = C.R) => {
        const clean = UTILS.strip(text);
        const gap = Math.max(0, innerW - clean.length);
        let pl = 0, pr = 0;
        if (align === 'center') { pl = Math.floor(gap / 2); pr = gap - pl; }
        else { pr = gap; } 
        console.log(`${P}${C.C}║${color}${" ".repeat(pl)}${text}${" ".repeat(pr)}${C.C}║${C.R}`);
    };

    // Helper Grid 3 Kolom untuk Status Bar
    const printGrid3 = (items) => {
        const colW = Math.floor(innerW / 3);
        let line = "";
        items.forEach((item, idx) => {
            const isLast = idx === 2;
            const w = isLast ? (innerW - UTILS.strip(line).length) : colW;
            const clean = UTILS.strip(item);
            const gap = Math.max(0, w - clean.length);
            const pl = Math.floor(gap / 2);
            const pr = gap - pl;
            line += `${C.D}${" ".repeat(pl)}${item}${" ".repeat(pr)}${C.R}`;
            if (!isLast) line += `${C.C}│${C.R}`;
        });
        console.log(`${P}${C.C}║${C.R}${line}${C.C}║${C.R}`);
    };

    // --- RENDER START ---
    console.log("\n".repeat(3)); // Spacer atas agar vertikal center
    drawTop();

    // 1. HEADER TITLE
    printRow(`${C.R}${I.EYE} MANUAL CONTRACT ANALYSIS ${I.EYE}`, 'center');
    drawMid();

    // 2. STATUS GRID (Dummy/Realtime info)
    // Memberikan kesan dashboard canggih
    const rpcTxt = STATE.rpcStatus.includes("ONLINE") ? `${C.G}ONLINE` : `${C.Err}OFFLINE`;
    printGrid3([
        `SYSTEM: ${C.G}READY${C.D}`, 
        `RPC: ${rpcTxt}${C.D}`, 
        `MODE: ${C.C}SCANNER${C.D}`
    ]);
    drawMid();

    // 3. INSTRUCTION AREA
    if (STATE.loading) {
        console.log(`${P}${C.C}║${" ".repeat(innerW)}║${C.R}`);
        printRow(`${C.C}${I.TIME} FETCHING DATA...`, 'center');
        printRow(`${STATE.statusMsg}`, 'center', C.D);
        console.log(`${P}${C.C}║${" ".repeat(innerW)}║${C.R}`);
        drawBot();
    } 
    else if (STATE.error) {
        console.log(`${P}${C.C}║${" ".repeat(innerW)}║${C.R}`);
        printRow(`${C.BG_Err}${C.W_B} ERROR DETECTED ${C.R}`, 'center');
        printRow(`${STATE.error}`, 'center', C.Err);
        printRow(`(Retrying...)`, 'center', C.D);
        console.log(`${P}${C.C}║${" ".repeat(innerW)}║${C.R}`);
        drawBot();
    } 
    else {
        // Normal Input State
        console.log(`${P}${C.C}║${" ".repeat(innerW)}║${C.R}`);
        printRow(`PASTE TOKEN ADDRESS BELOW`, 'center', C.Y);
        printRow(`(Press [ESC] to Return to Menu)`, 'center', C.D);
        console.log(`${P}${C.C}║${" ".repeat(innerW)}║${C.R}`);
        drawDiv();

        // 4. INPUT FIELD (Grid Style)
        // Kita buat baris input terlihat menyatu dengan border
        const promptLabel = " INPUT ➤ ";
        const promptW = UTILS.strip(promptLabel).length;
        
        // Render baris input (bagian kiri)
        // Kita tidak menutup border kanan di baris ini secara visual di console.log
        // tapi kita gunakan process.stdout untuk prompt
        
        // Trik: Render bagian statis "║ INPUT ➤ "
        const prefix = `${P}${C.C}║${C.G_B}${promptLabel}${C.R}`;
        process.stdout.write(prefix);
    }
};
