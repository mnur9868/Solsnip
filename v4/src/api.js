/* PATCH: API-Sorting-Fix#v4.4 ( api~sort-by-age ) */
import { CONFIG } from './config.js';
import { STATE } from './state.js';
import { UTILS } from './utils.js';
import { PublicKey } from '@solana/web3.js';

export const DATA_SERVICE = {
    // ... mapPairToRow TETAP SAMA ...
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

            // --- LOGIKA SORTING BARU ---
            if (STATE.mode === 'TRENDING') {
                // Trending: Sort by Liquidity (High to Low)
                STATE.data.sort((a, b) => b.Liquidity - a.Liquidity);
            } else {
                // New/Solana/Default: Sort by Age (Newest/Highest Timestamp First)
                STATE.data.sort((a, b) => b.Age - a.Age);
            }
            
            STATE.lastUpdated = new Date().toLocaleTimeString();
        } catch (err) { STATE.error = err.message; }
        finally { STATE.loading = false; STATE.tableIdx = 0; STATE.tablePage = 0; STATE.statusMsg = "READY"; renderCallback(); }
    },

    // ... fetchCustomAddress, fetchSecurity, analyzeToken, fetchWalletBalance TETAP SAMA ...
    async fetchCustomAddress(address, renderCallback, startLiveUpdate, retryCallback) {
        STATE.loading = true; STATE.statusMsg = "VALIDATING..."; 
        renderCallback();
        const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
        if (!solanaRegex.test(address)) {
            STATE.loading = false; STATE.error = "INVALID SOLANA ADDRESS FORMAT"; renderCallback();
            setTimeout(() => { STATE.error = null; retryCallback(); }, 2000); return;
        }
        try {
            STATE.statusMsg = "SEARCHING CONTRACT..."; renderCallback();
            const res = await fetch(`${CONFIG.API.TOKENS}${address}`);
            const data = await res.json();
            if (!data.pairs?.length) throw new Error("TOKEN NOT FOUND ON DEX");
            const bestPair = data.pairs.sort((a,b) => (b.liquidity?.usd||0)-(a.liquidity?.usd||0))[0];
            STATE.currentRow = this.mapPairToRow(bestPair);
            STATE.loading = false; STATE.view = 'DETAILS'; startLiveUpdate();
        } catch (err) { 
            STATE.loading = false; STATE.error = err.message; renderCallback();
            setTimeout(() => { STATE.error = null; retryCallback(); }, 2000);
        }
    },

    async fetchSecurity(mintAddr, renderCallback) {
        if (!mintAddr || !STATE.connection) return;
        STATE.security.loading = true; renderCallback();
        try {
            const mintPubkey = new PublicKey(mintAddr);
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
            if (largestAccounts.value) {
                const supplyDiv = STATE.security.supply / Math.pow(10, STATE.security.decimals);
                STATE.security.holders = largestAccounts.value.slice(0, 5).map(acc => ({
                    address: acc.address.toString(),
                    amount: acc.uiAmount,
                    pct: (acc.uiAmount / supplyDiv) * 100
                }));
            }
        } catch (e) {} finally { STATE.security.loading = false; renderCallback(); }
    },

    analyzeToken(item) {
        let score = 100, warnings = [], riskLevel = "SAFE", riskColor = CONFIG.COLORS.G;
        if (item.Liquidity < 500) { score -= 50; warnings.push("CRITICAL LIQ"); }
        else if (item.Liquidity < 2000) { score -= 25; warnings.push("LOW LIQ"); }
        if (!item.Socials?.length && !item.Websites?.length) { score -= 20; warnings.push("NO SOCIALS"); }
        if ((Date.now() - item.Age) < 60000) { score -= 10; warnings.push("FRESH LAUNCH"); }
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
