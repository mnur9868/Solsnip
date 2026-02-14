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
    warRoom: [], // Menyimpan list transaksi (Buy, Sell, Liq, dll)
    warRoomLoading: false,
    connection: null
};
