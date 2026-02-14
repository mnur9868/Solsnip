/* PATCH: API-Smart-Holders#v5.7 ( api~smart-holder-fallback ) */
import { CONFIG } from './config.js';
import { STATE } from './state.js';
import { UTILS } from './utils.js';
import { PublicKey } from '@solana/web3.js';
// Pastikan @solana/spl-token terinstall jika ingin fitur advance, 
// tapi kita pakai native RPC call biar kompatibel tanpa deps tambahan berat.

export const DATA_SERVICE = {
    // --- MAPPING DATA (TETAP) ---
    mapPairToRow: (pair) => ({
        Symbol: pair.baseToken.symbol,
        Name: pair.baseToken.name,
        Chain: pair.chainId,
        Price: pair.priceUsd,
        Liquidity: pair.liquidity?.usd || 0,
        FDV: pair.fdv || 0,
        Age: pair.pairCreatedAt || Date.now(),
        Address: pair.baseToken.address,
        Dex: pair.dexId,
        Type: pair.type || 'SPOT',
        Url: pair.url,
        Socials: pair.info?.socials || [],
        Websites: pair.info?.websites || []
    }),

    async refreshList(renderCallback) {
        STATE.loading = true; STATE.data = []; STATE.statusMsg = "FETCHING FEED...";
        renderCallback();
        try {
            let url = (STATE.mode === 'TRENDING') ? CONFIG.API.TRENDING : CONFIG.API.NEW;
            const profileRes = await fetch(url);
            const profiles = await profileRes.json();
            let targetProfiles = (STATE.mode === 'SOLANA') ? profiles.filter(p => p.chainId === 'solana') : profiles;

            const addresses = targetProfiles.map(p => p.tokenAddress).filter(a => a);
            let allPairs = [];
            
            // Batch fetch untuk performa
            for (let i = 0; i < addresses.length; i += 30) {
                const chunk = addresses.slice(i, i + 30);
                const pairRes = await fetch(`${CONFIG.API.TOKENS}${chunk.join(',')}`);
                const pairData = await pairRes.json();
                if (pairData.pairs) allPairs = allPairs.concat(pairData.pairs);
            }

            STATE.data = targetProfiles.map(profile => {
                const bestPair = allPairs.filter(p => p.baseToken.address === profile.tokenAddress)
                                         .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
                return bestPair ? this.mapPairToRow(bestPair) : null;
            }).filter(i => i !== null);

            if (STATE.mode === 'TRENDING') STATE.data.sort((a, b) => b.Liquidity - a.Liquidity);
            else STATE.data.sort((a, b) => b.Age - a.Age);
            
            STATE.lastUpdated = new Date().toLocaleTimeString();
        } catch (err) { STATE.error = err.message; }
        finally { STATE.loading = false; STATE.tableIdx = 0; STATE.tablePage = 0; STATE.statusMsg = "READY"; renderCallback(); }
    },

    async fetchCustomAddress(address, renderCallback, startLiveUpdate, retryCallback) {
        STATE.loading = true; STATE.statusMsg = "VALIDATING..."; 
        renderCallback();
        const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
        if (!solanaRegex.test(address)) {
            STATE.loading = false; STATE.error = "INVALID FORMAT"; renderCallback();
            setTimeout(() => { STATE.error = null; retryCallback(); }, 2000); return;
        }
        try {
            STATE.statusMsg = "SEARCHING DEX..."; renderCallback();
            const res = await fetch(`${CONFIG.API.TOKENS}${address}`);
            const data = await res.json();
            if (!data.pairs?.length) throw new Error("TOKEN NOT FOUND");
            const bestPair = data.pairs.sort((a,b) => (b.liquidity?.usd||0)-(a.liquidity?.usd||0))[0];
            STATE.currentRow = this.mapPairToRow(bestPair);
            STATE.loading = false; STATE.view = 'DETAILS'; startLiveUpdate();
        } catch (err) { 
            STATE.loading = false; STATE.error = err.message; renderCallback();
            setTimeout(() => { STATE.error = null; retryCallback(); }, 2000);
        }
    },

    // --- SECURITY & HOLDER SCAN ---
    async fetchSecurity(mintAddr, renderCallback) {
        if (!mintAddr || !STATE.connection) return;
        
        // Reset state awal
        STATE.security.loading = true; 
        STATE.security.totalHolders = "Scanning.."; 
        renderCallback();
        
        try {
            const mintPubkey = new PublicKey(mintAddr);
            
            // 1. Ambil Info Dasar & Top 20 (Cepat)
            const [mintInfo, largestAccounts] = await Promise.all([
                STATE.connection.getParsedAccountInfo(mintPubkey),
                STATE.connection.getTokenLargestAccounts(mintPubkey)
            ]);

            if (mintInfo.value) {
                const d = mintInfo.value.data.parsed.info;
                STATE.security.mintAuth = d.mintAuthority;
                STATE.security.freezeAuth = d.freezeAuthority;
                STATE.security.supply = parseFloat(d.supply);
                STATE.security.decimals = d.decimals;
            }

            // Simpan Top Holders untuk Warning System
            if (largestAccounts.value) {
                const supplyDiv = STATE.security.supply / Math.pow(10, STATE.security.decimals);
                STATE.security.holders = largestAccounts.value.slice(0, 5).map(acc => ({
                    address: acc.address.toString(),
                    amount: acc.uiAmount,
                    pct: (acc.uiAmount / supplyDiv) * 100
                }));
            }
            
            STATE.security.loading = false;
            renderCallback(); // Update UI dengan data awal

            // 2. Scan Total Holders (Lambat / Berat)
            // Jalankan di background agar tidak memblokir UI
            this.bgScanTotalHolders(mintAddr, largestAccounts.value?.length || 0)
                .then(res => {
                    STATE.security.totalHolders = res;
                    renderCallback(); // Update lagi setelah selesai
                });

        } catch (e) {
            STATE.security.loading = false;
            STATE.security.totalHolders = "N/A";
            renderCallback();
        }
    },

    // Fungsi Background Scan dengan Timeout & Fallback
    async bgScanTotalHolders(mintAddr, topCount) {
        if (!STATE.connection) return "Off";
        
        // Buat janji dengan timeout 5 detik (agar tidak scanning selamanya)
        const timeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Timeout")), 8000)
        );

        const scan = (async () => {
            // Filter gPA (getProgramAccounts)
            // Membutuhkan RPC yang layak. RPC public sering memblokir ini.
            const accounts = await STATE.connection.getProgramAccounts(
                new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
                {
                    filters: [
                        { dataSize: 165 }, 
                        { memcmp: { offset: 0, bytes: mintAddr } }
                    ],
                    dataSlice: { offset: 0, length: 0 } // Hemat bandwidth
                }
            );
            return UTILS.formatNumber(accounts.length);
        })();

        try {
            return await Promise.race([scan, timeout]);
        } catch (e) {
            // FALLBACK LOGIC:
            // Jika RPC timeout/gagal, kita gunakan data Top 20 yang sudah ada.
            // Jika Top 20 penuh, kemungkinan holdernya banyak.
            if (topCount >= 20) return "20+ (RPC Busy)";
            return `${topCount}`;
        }
    },

    analyzeToken(item) {
        let score = 100, warnings = [], riskLevel = "SAFE", riskColor = CONFIG.COLORS.G;
        if (item.Liquidity < 1000) { score -= 50; warnings.push("CRITICAL LIQ"); }
        else if (item.Liquidity < 5000) { score -= 25; warnings.push("LOW LIQ"); }
        if (!item.Socials?.length && !item.Websites?.length) { score -= 20; warnings.push("NO SOCIALS"); }
        if ((Date.now() - item.Age) < 300000) { score -= 10; warnings.push("FRESH LAUNCH"); }
        
        if (score < 50) { riskLevel = "HIGH RISK"; riskColor = CONFIG.COLORS.Err; }
        else if (score < 80) { riskLevel = "CAUTION"; riskColor = CONFIG.COLORS.Y; }
        return { score, riskLevel, riskColor, warnings };
    },

    async fetchWalletBalance() {
        if (!STATE.connection || !STATE.wallet.address) return;
        try {
            const pubKey = new PublicKey(STATE.wallet.address);
            const balance = await STATE.connection.getBalance(pubKey);
            STATE.wallet.balance = balance / 1e9; 
        } catch (e) { STATE.wallet.balance = 0; }
    }
};
