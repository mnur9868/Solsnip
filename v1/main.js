/* PATCH: Interactive-Input-Nav-Fix#v3.5 ( main~polish-ux ) */
import 'dotenv/config';
import { Connection } from '@solana/web3.js';
import readline from "readline";
import { CONFIG } from './src/config.js';
import { STATE } from './src/state.js';
import { DATA_SERVICE } from './src/api.js';
import { RENDERER } from './src/renderer.js';
import { UTILS } from './src/utils.js';

// Init RPC
try {
    STATE.connection = new Connection(CONFIG.RPC_URL, 'confirmed');
    STATE.rpcStatus = `${CONFIG.COLORS.G}ONLINE${CONFIG.COLORS.R}`;
} catch (e) {
    STATE.rpcStatus = `${CONFIG.COLORS.Err}OFFLINE${CONFIG.COLORS.R}`;
}

readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) process.stdin.setRawMode(true);

const CORE_LOGIC = {
    async refreshCurrentToken() {
        if (!STATE.currentRow) return;
        try {
            const res = await fetch(`${CONFIG.API.TOKENS}${STATE.currentRow.Address}`);
            const data = await res.json();
            if (data.pairs?.length) {
                STATE.currentRow = DATA_SERVICE.mapPairToRow(data.pairs.sort((a,b)=>(b.liquidity?.usd||0)-(a.liquidity?.usd||0))[0]);
            }
        } catch (e) {} finally { 
            if (STATE.view === 'DETAILS') RENDERER.draw(); 
        }
    },

    startDetailsLiveUpdate() {
        this.stopDetailsLiveUpdate();
        this.refreshCurrentToken();
        if (STATE.currentRow.Chain === 'solana') DATA_SERVICE.fetchSecurity(STATE.currentRow.Address, RENDERER.draw);
        STATE.refreshInterval = setInterval(() => this.refreshCurrentToken(), 2000);
    },

    stopDetailsLiveUpdate() {
        if (STATE.refreshInterval) { clearInterval(STATE.refreshInterval); STATE.refreshInterval = null; }
    }
};

// --- MANUAL INPUT ENGINE (RAW MODE) ---
let inputBuffer = ""; 

const startCustomInputMode = () => {
    STATE.view = 'INPUT';
    STATE.error = null;
    inputBuffer = ""; 
    RENDERER.draw(); 
    // Render cursor awal
    process.stdout.write(`\x1b[s`); // Save cursor position
};

// Fungsi Helper untuk Redraw Input Line secara interaktif
const redrawInputLine = () => {
    // Pindah kursor ke posisi input (baris terakhir dari render input)
    // Kita hapus baris terakhir lalu tulis ulang buffer
    const C = CONFIG.COLORS;
    // Pindah ke kolom 0, hapus baris, tulis prompt + buffer
    process.stdout.write(`\r\x1b[K`); 
    // Kita center promptnya manual sedikit agar rapi
    const totalW = process.stdout.columns || 80;
    const prompt = "CONTRACT: ";
    const leftPad = Math.floor((totalW - (prompt.length + inputBuffer.length)) / 2);
    // Tulis ulang baris input
    // Agar lebih mudah, kita minta RENDERER gambar ulang semua, lalu kita print buffer di bawahnya
    // Tapi itu kedip. Jadi kita timpa saja baris terakhir.
    // Asumsi prompt ada di baris ke-9 dari fungsi drawInput
    
    // Cara paling aman tanpa flicker: Re-draw seluruh view, lalu print buffer
    RENDERER.draw();
    process.stdout.write(inputBuffer);
};

process.stdin.on('keypress', (str, key) => {
    
    // --- 1. HANDLING MODE INPUT ---
    if (STATE.view === 'INPUT') {
        if (!key) return;

        if (key.name === 'escape') {
            STATE.view = 'MENU';
            inputBuffer = "";
            RENDERER.draw();
            return;
        }

        if (key.name === 'return' || key.name === 'enter') {
            const addr = inputBuffer.trim();
            if (!addr) {
                STATE.view = 'MENU';
                inputBuffer = "";
                RENDERER.draw();
            } else {
                DATA_SERVICE.fetchCustomAddress(
                    addr,
                    RENDERER.draw,
                    () => CORE_LOGIC.startDetailsLiveUpdate(),
                    startCustomInputMode 
                );
            }
            return;
        }

        if (key.name === 'backspace') {
            if (inputBuffer.length > 0) {
                inputBuffer = inputBuffer.slice(0, -1);
                redrawInputLine();
            }
            return;
        }

        if (key.ctrl && key.name === 'c') process.exit();

        // Filter input karakter (Huruf, Angka)
        if (str && str.length === 1 && !key.ctrl && !key.meta && /^[a-zA-Z0-9]$/.test(str)) {
            inputBuffer += str;
            redrawInputLine();
        }
        return; 
    }

    // --- 2. HANDLING MODE NAVIGASI ---
    if (key.ctrl && key.name === 'c') { CORE_LOGIC.stopDetailsLiveUpdate(); process.exit(); }

    if (STATE.view === 'MENU') {
        if (key.name === 'up' && STATE.menuIdx > 0) { STATE.menuIdx--; RENDERER.draw(); }
        else if (key.name === 'down' && STATE.menuIdx < CONFIG.MENUS.length - 1) { STATE.menuIdx++; RENDERER.draw(); }
        else if (key.name === 'return' || key.name === 'enter') {
            const choice = CONFIG.MENUS[STATE.menuIdx];
            if (choice.id === 'EXIT') process.exit();
            STATE.mode = choice.id;
            
            if (choice.id === 'CUSTOM') {
                startCustomInputMode();
            } else { 
                STATE.view = 'TABLE'; 
                DATA_SERVICE.refreshList(RENDERER.draw); 
            }
        }
    }
    else if (STATE.view === 'TABLE') {
        if (key.name === 'r') DATA_SERVICE.refreshList(RENDERER.draw);
        else if (['escape', 'backspace'].includes(key.name)) { STATE.view = 'MENU'; STATE.data = []; RENDERER.draw(); }
        else if (key.name === 'up' && STATE.tableIdx > 0) { STATE.tableIdx--; RENDERER.draw(); }
        else if (key.name === 'down') {
            const max = Math.min(STATE.itemsPerPage, STATE.data.length - (STATE.tablePage * STATE.itemsPerPage)) - 1;
            if (STATE.tableIdx < max) { STATE.tableIdx++; RENDERER.draw(); }
        }
        else if (key.name === 'right') {
            if (STATE.tablePage < Math.ceil(STATE.data.length/STATE.itemsPerPage)-1) { STATE.tablePage++; STATE.tableIdx = 0; RENDERER.draw(); }
        }
        else if (key.name === 'left' && STATE.tablePage > 0) { STATE.tablePage--; STATE.tableIdx = 0; RENDERER.draw(); }
        else if (key.name === 'return' || key.name === 'enter') {
            const idx = (STATE.tablePage * STATE.itemsPerPage) + STATE.tableIdx;
            if (STATE.data[idx]) { STATE.currentRow = STATE.data[idx]; STATE.view = 'DETAILS'; RENDERER.draw(); CORE_LOGIC.startDetailsLiveUpdate(); }
        }
    }
    else if (STATE.view === 'DETAILS') {
        if (key.name === 'r') {
            CORE_LOGIC.refreshCurrentToken();
        }
        else if (['escape', 'backspace'].includes(key.name)) { 
            CORE_LOGIC.stopDetailsLiveUpdate(); 
            
            // LOGIKA NAVIGASI BACK YANG DIPERBAIKI
            // Jika user datang dari menu CUSTOM, kembalikan ke MENU (karena tidak ada tabel)
            // Jika user datang dari TABLE (New/Trending), kembalikan ke TABLE
            if (STATE.mode === 'CUSTOM') {
                STATE.view = 'MENU';
                RENDERER.draw();
            } else {
                STATE.view = 'TABLE'; // KEMBALI KE TABEL
                RENDERER.draw();
            }
        }
    }
});

RENDERER.draw();
