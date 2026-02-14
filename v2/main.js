/* PATCH: Main-WarRoom-Features#v4.1 ( main~features-update ) */
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

// Fetch Wallet Balance
DATA_SERVICE.fetchWalletBalance();

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
    },

    // --- WAR ROOM SIMULATOR (UPDATED) ---
    startWarRoomGenerator() {
        if (STATE.warRoomInterval) clearInterval(STATE.warRoomInterval);
        STATE.warRoomLogs = []; 
        STATE.warRoomPage = 0; // Reset ke halaman pertama
        
        STATE.warRoomInterval = setInterval(() => {
            // Simulasi tetap jalan di background, tapi hanya render jika di view WAR_ROOM
            // Agar saat kita scroll history, data baru tetap masuk
            
            const row = STATE.currentRow;
            const currentPrice = parseFloat(row.Price) || 0;
            const isBuy = Math.random() > 0.45; 
            
            // Variasi harga kecil
            const change = currentPrice * (Math.random() * 0.05); 
            const tradePrice = isBuy ? currentPrice + change : currentPrice - change;
            
            // Random SOL amount (0.1 - 5 SOL)
            const solAmtRaw = (Math.random() * 5);
            const solAmt = solAmtRaw.toFixed(2);
            
            // Hitung Token Amount
            let tokenAmtStr = "0";
            if (tradePrice > 0) {
                const tokens = solAmtRaw / tradePrice; // Estimasi kasar: SOL / Price USD (biasanya SOL/SOL Price, tapi ini simulasi visual)
                // Koreksi: Price di API biasanya USD. Kita perlu SOL Price. 
                // Asumsi SOL = $150 (Hardcoded for simulation visual consistency)
                const solPriceUSD = 150; 
                const tokensReal = (solAmtRaw * solPriceUSD) / tradePrice;
                tokenAmtStr = UTILS.formatNumber(tokensReal);
            }

            const usdAmt = (parseFloat(solAmt) * 150).toFixed(0); 
            
            const log = {
                time: new Date().toLocaleTimeString().split(' ')[0],
                type: isBuy ? 'BUY' : 'SELL',
                price: '$' + tradePrice.toFixed(6),
                sol: solAmt + ' ◎',
                tokens: tokenAmtStr, // Data Baru
                usd: '$' + usdAmt,
                maker: UTILS.truncate('Ag' + Math.random().toString(36).substring(7), 8) + '..'
            };
            
            STATE.warRoomLogs.push(log);
            
            // Simpan log lebih banyak untuk pagination (misal 200 log terakhir)
            if (STATE.warRoomLogs.length > 200) STATE.warRoomLogs.shift(); 
            
            // Hanya redraw otomatis jika kita sedang di halaman pertama (Live View)
            if (STATE.view === 'WAR_ROOM' && STATE.warRoomPage === 0) {
                RENDERER.draw();
            }
        }, 800); 
    }
};

// --- MANUAL INPUT ENGINE ---
let inputBuffer = ""; 

const startCustomInputMode = () => {
    STATE.view = 'INPUT';
    STATE.error = null;
    inputBuffer = ""; 
    RENDERER.draw(); 
};

const redrawInputLine = () => {
    process.stdout.write(`\r\x1b[K`); 
    RENDERER.draw();
    const w = process.stdout.columns || 80;
    const boxW = Math.max(40, Math.min(64, w - 4));
    const P = " ".repeat(Math.max(0, Math.floor((w - boxW) / 2)));
    const prefix = `\x1b[36m╚═══════════════════➤ \x1b[0m`; 
    process.stdout.write(P + prefix + inputBuffer);
};

process.stdin.on('keypress', (str, key) => {
    
    // 1. INPUT MODE
    if (STATE.view === 'INPUT') {
        if (!key) return;
        if (key.name === 'escape') { STATE.view = 'MENU'; inputBuffer = ""; RENDERER.draw(); return; }
        if (key.name === 'return' || key.name === 'enter') {
            const addr = inputBuffer.trim();
            if (!addr) { STATE.view = 'MENU'; inputBuffer = ""; RENDERER.draw(); } 
            else { DATA_SERVICE.fetchCustomAddress(addr, RENDERER.draw, () => CORE_LOGIC.startDetailsLiveUpdate(), startCustomInputMode); }
            return;
        }
        if (key.name === 'backspace') { if (inputBuffer.length > 0) { inputBuffer = inputBuffer.slice(0, -1); redrawInputLine(); } return; }
        if (key.ctrl && key.name === 'c') process.exit();
        if (str && str.length === 1 && !key.ctrl && !key.meta && /^[a-zA-Z0-9]$/.test(str)) { inputBuffer += str; redrawInputLine(); }
        return; 
    }

    // 2. GLOBAL KEYS
    if (key.ctrl && key.name === 'c') { CORE_LOGIC.stopDetailsLiveUpdate(); process.exit(); }

    // 3. MENU MODE
    if (STATE.view === 'MENU') {
        if (key.name === 'up' && STATE.menuIdx > 0) { STATE.menuIdx--; RENDERER.draw(); }
        else if (key.name === 'down' && STATE.menuIdx < CONFIG.MENUS.length - 1) { STATE.menuIdx++; RENDERER.draw(); }
        else if (key.name === 'return' || key.name === 'enter') {
            const choice = CONFIG.MENUS[STATE.menuIdx];
            if (choice.id === 'EXIT') process.exit();
            STATE.mode = choice.id;
            if (choice.id === 'CUSTOM') startCustomInputMode();
            else { STATE.view = 'TABLE'; DATA_SERVICE.refreshList(RENDERER.draw); }
        }
    }
    // 4. TABLE MODE
    else if (STATE.view === 'TABLE') {
        if (key.name === 'r') DATA_SERVICE.refreshList(RENDERER.draw);
        // HAPUS BACKSPACE, HANYA ESCAPE
        else if (key.name === 'escape') { STATE.view = 'MENU'; STATE.data = []; RENDERER.draw(); }
        
        else if (key.name === 'up' && STATE.tableIdx > 0) { STATE.tableIdx--; RENDERER.draw(); }
        else if (key.name === 'down') {
            const max = Math.min(STATE.itemsPerPage, STATE.data.length - (STATE.tablePage * STATE.itemsPerPage)) - 1;
            if (STATE.tableIdx < max) { STATE.tableIdx++; RENDERER.draw(); }
        }
        else if (key.name === 'right') { if (STATE.tablePage < Math.ceil(STATE.data.length/STATE.itemsPerPage)-1) { STATE.tablePage++; STATE.tableIdx = 0; RENDERER.draw(); } }
        else if (key.name === 'left' && STATE.tablePage > 0) { STATE.tablePage--; STATE.tableIdx = 0; RENDERER.draw(); }
        else if (key.name === 'return' || key.name === 'enter') {
            const idx = (STATE.tablePage * STATE.itemsPerPage) + STATE.tableIdx;
            if (STATE.data[idx]) { STATE.currentRow = STATE.data[idx]; STATE.view = 'DETAILS'; RENDERER.draw(); CORE_LOGIC.startDetailsLiveUpdate(); }
        }
    }
    // 5. DETAILS MODE
    else if (STATE.view === 'DETAILS') {
        if (key.name === 'r') CORE_LOGIC.refreshCurrentToken();
        else if (key.name === 'c') {
            if (STATE.currentRow?.Address) UTILS.copyToClipboard(STATE.currentRow.Address);
        }
        // TAMBAHAN: Shortcut 'W' untuk ke War Room
        else if (key.name === 'w') {
            STATE.view = 'WAR_ROOM';
            CORE_LOGIC.startWarRoomGenerator();
            RENDERER.draw();
        }
        
        // HAPUS BACKSPACE, HANYA ESCAPE
        else if (key.name === 'escape') { 
            CORE_LOGIC.stopDetailsLiveUpdate(); 
            if (STATE.mode === 'CUSTOM') { STATE.view = 'MENU'; RENDERER.draw(); } 
            else { STATE.view = 'TABLE'; RENDERER.draw(); }
        }
    }
    // 6. WAR ROOM MODE
    else if (STATE.view === 'WAR_ROOM') {
        // HAPUS BACKSPACE, HANYA ESCAPE
        if (key.name === 'escape') {
            if (STATE.warRoomInterval) clearInterval(STATE.warRoomInterval);
            STATE.view = 'DETAILS';
            RENDERER.draw();
        }
        // NAVIGASI PAGINATION
        else if (key.name === 'right') {
            // Next Page (History lama)
            const maxPage = Math.ceil(STATE.warRoomLogs.length / STATE.warRoomItemsPerPage) - 1;
            if (STATE.warRoomPage < maxPage) {
                STATE.warRoomPage++;
                RENDERER.draw();
            }
        }
        else if (key.name === 'left') {
            // Prev Page (Kembali ke Live)
            if (STATE.warRoomPage > 0) {
                STATE.warRoomPage--;
                RENDERER.draw();
            }
        }
    }
});

RENDERER.draw();
