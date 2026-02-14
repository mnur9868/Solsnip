/* PATCH: State-HolderCount#v5.6 ( state~add-holder-count ) */
import { CONFIG } from './config.js';

export const STATE = {
    view: 'MENU', mode: null, menuIdx: 0,
    data: [], currentRow: null,
    loading: false, error: null, statusMsg: "SYSTEM READY",
    tableIdx: 0, tablePage: 0, itemsPerPage: CONFIG.ITEMS_PER_PAGE,
    lastUpdated: null,
    
    // UPDATE SECURITY STATE
    security: { 
        mintAuth: null, 
        freezeAuth: null, 
        holders: [], 
        totalHolders: "Scanning..", // <--- TAMBAHKAN INI
        loading: false, 
        supply: 0, 
        decimals: 0 
    },
    
    rpcStatus: 'INIT...',
    refreshInterval: null,
    
    wallet: {
        address: process.env.WALLET_ADDRESS || null,
        balance: 0,
        loading: false
    },
    
    warRoomLogs: [], 
    warRoomPage: 0,
    warRoomItemsPerPage: 15,
    warRoomIdx: 0, 
    warRoomInterval: null,
    
    warRoomStats: {
        sessionVol: 0,
        buyVol: 0,
        sellVol: 0,
        buyCount: 0,
        sellCount: 0
    },
    
    connection: null
};
