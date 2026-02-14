/* PATCH: UI~Professional#1.7 ( config~cyber-palette#v2.7 ) */
export const CONFIG = {
    RPC_URL: process.env.RPC_URL || "https://api.mainnet-beta.solana.com",
    API: {
        NEW: "https://api.dexscreener.com/token-profiles/latest/v1",
        TRENDING: "https://api.dexscreener.com/token-boosts/top/v1",
        TOKENS: "https://api.dexscreener.com/latest/dex/tokens/"
    },
    MENUS: [
        { id: 'NEW',      name: 'SCAN NEW PAIRS',    desc: 'Real-time feed of newly created pools' },
        { id: 'TRENDING', name: 'TRENDING TOKENS',   desc: 'Most active tokens by volume/boosts' },
        { id: 'SOLANA',   name: 'SOLANA SNIPER',     desc: 'Solana-chain exclusive filter' },
        { id: 'CUSTOM',   name: 'CONTRACT ANALYZER', desc: 'Deep dive into specific address' },
        { id: 'EXIT',     name: 'TERMINATE SYSTEM',  desc: 'Close connection' }
    ],
    ITEMS_PER_PAGE: 15,
    COLORS: {
        // Text Styles
        R: "\x1b[0m",       // Reset
        B: "\x1b[1m",       // Bold
        D: "\x1b[2m",       // Dim (Grayish)
        
        // High Contrast Foregreens
        W: "\x1b[37m",      // Standard White
        W_B: "\x1b[1m\x1b[37m", // Bright White
        K: "\x1b[30m",      // Black
        
        // Neon Accents
        C: "\x1b[36m",      // Cyan (Primary Border)
        C_B: "\x1b[1m\x1b[36m", // Bright Cyan
        G: "\x1b[32m",      // Green (Success/Safe)
        G_B: "\x1b[1m\x1b[32m", // Bright Green
        Y: "\x1b[33m",      // Yellow (Warning)
        M: "\x1b[35m",      // Magenta (Secondary)
        Err: "\x1b[31m",    // Red (Danger)
        
        // Backgrounds (Used sparingly for highlights)
        BG_Sel: "\x1b[46m\x1b[30m",     // Cyan BG, Black Text
        BG_Head: "\x1b[100m\x1b[37m",   // Dark Gray BG, White Text (Header)
        BG_Warn: "\x1b[43m\x1b[30m",    // Yellow BG
        BG_Err: "\x1b[41m\x1b[37m",     // Red BG
    },
    ICONS: {
        CHECK: "✔", CROSS: "✖", WARN: "⚠",
        ROCKET: "🚀", EYE: "👁", LOCK: "🔒",
        LIQ: "💧", TIME: "⏳", LINK: "🔗",
        GRID: "▒"
    }
};
