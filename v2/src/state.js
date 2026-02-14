/* PATCH: State-Pagination#v4.1 ( state~warroom-pagination ) */
import { CONFIG } from './config.js';

export const STATE = {
    view: 'MENU', mode: null, menuIdx: 0,
    data: [], currentRow: null,
    loading: false, error: null, statusMsg: "SYSTEM READY",
    tableIdx: 0, tablePage: 0, itemsPerPage: CONFIG.ITEMS_PER_PAGE,
    lastUpdated: null,
    security: { mintAuth: null, freezeAuth: null, holders: [], loading: false, supply: 0, decimals: 0 },
    rpcStatus: 'INIT...',
    refreshInterval: null,
    
    wallet: {
        address: process.env.WALLET_ADDRESS || null,
        balance: 0,
        loading: false
    },
    portfolio: {
        active: false,
        entryPrice: 0,
        tokenAmount: 0,
        pnl: 0
    },
    
    // --- UPDATE WAR ROOM ---
    warRoomLogs: [], 
    warRoomPage: 0,          // Halaman saat ini
    warRoomItemsPerPage: 15, // Item per halaman
    warRoomInterval: null,
    
    connection: null
};
