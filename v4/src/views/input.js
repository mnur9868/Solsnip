/* PATCH: Pro-Open-HUD-Input#v3.8 ( view~responsive-elegance ) */
import { CONFIG } from '../config.js';
import { STATE } from '../state.js';
import { UTILS } from '../utils.js';

const C = CONFIG.COLORS;
const I = CONFIG.ICONS;

export const drawInput = () => {
    UTILS.clear();
    const totalW = process.stdout.columns || 80;
    
    // 1. Dynamic Width Calculation (Max 64 chars, Min 40, or Full Width - 4)
    const boxW = Math.max(40, Math.min(64, totalW - 4));
    const P = " ".repeat(Math.max(0, Math.floor((totalW - boxW) / 2))); // Left Padding for centering

    // Helper untuk membuat baris di dalam box dengan border kanan kiri
    const printBoxLine = (text = "", align = "left") => {
        const cleanText = UTILS.strip(text);
        const innerW = boxW - 4; // -4 untuk "│ " dan " │"
        const padLen = Math.max(0, innerW - cleanText.length);
        
        let content = "";
        if (align === "center") {
            const leftP = " ".repeat(Math.floor(padLen / 2));
            const rightP = " ".repeat(padLen - leftP.length);
            content = `${leftP}${text}${rightP}`;
        } else {
            content = `${text}${" ".repeat(padLen)}`;
        }
        
        console.log(`${P}${C.C}│ ${C.R}${content}${C.C} │${C.R}`);
    };

    // --- RENDER START ---
    console.log("\n".repeat(3));

    // 2. MAIN HEADER (Compact & Clean)
    const title = `${I.EYE}  CONTRACT ANALYZER  ${I.EYE}`;
    const lineLen = boxW - 2 - UTILS.strip(title).length - 2; // -2 corner, -2 padding
    const topDash = "═".repeat(Math.max(0, Math.floor(lineLen / 2)));
    const botDash = "═".repeat(boxW - 2);

    console.log(`${P}${C.C}╔${topDash} ${C.D}${title}${C.R}${C.C} ${topDash}${lineLen % 2 !== 0 ? "═" : ""}╗${C.R}`);
    
    // 3. STATUS HANDLING
    if (STATE.loading) {
        // Tampilan Loading di dalam box
        console.log(`${P}${C.C}║${" ".repeat(boxW-2)}║${C.R}`);
        console.log(`${P}${C.C}║${UTILS.center(`${C.C}${I.TIME} ${STATE.statusMsg}${C.R}`, boxW-2)}${C.C}║${C.R}`);
        console.log(`${P}${C.C}╚${botDash}╝${C.R}`);
        return; // Stop render prompt jika loading
    } 
    else if (STATE.error) {
        // Tampilan Error di dalam box
        console.log(`${P}${C.C}║${" ".repeat(boxW-2)}║${C.R}`);
        console.log(`${P}${C.C}║${UTILS.center(`${C.BG_Err}${C.W_B} ERROR: ${STATE.error} ${C.R}`, boxW-2)}${C.C}║${C.R}`);
        console.log(`${P}${C.C}║${UTILS.center(`${C.D}Retrying...${C.R}`, boxW-2)}${C.C}║${C.R}`);
        console.log(`${P}${C.C}╚${botDash}╝${C.R}`);
        return; // Stop render prompt jika error
    }

    // 4. NORMAL INPUT STATE (The "Panel")
    // Spacer top
    console.log(`${P}${C.C}║${" ".repeat(boxW-2)}║${C.R}`);

    // Instruction (Centered)
    const instr = "( Press [ESC] to Return )";
    console.log(`${P}${C.C}║${UTILS.center(`${C.D}${instr}${C.R}`, boxW-2)}${C.C}║${C.R}`);
    
    // Spacer mid
    console.log(`${P}${C.C}╟${"─".repeat(boxW-2)}╢${C.R}`);

    // Input Label Area
    console.log(`${P}${C.C}║${C.R}  Paste Contract Address:${" ".repeat(boxW - 27)}${C.C}║${C.R}`);
    console.log(`${P}${C.C}║${" ".repeat(boxW-2)}║${C.R}`); // Empty line for breathing room

    // 5. INPUT PROMPT (Open Bracket Style)
    // Bentuk: ╚══➤ [Cursor]
    // Ini memberikan kesan bahwa input ini adalah bagian dari sistem, tapi terbuka ke kanan untuk teks panjang
    const bottomFrame = "╚═➤ ";
    
    process.stdout.write(`${P}${C.C}${bottomFrame}${C.R}`);
};
