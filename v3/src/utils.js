/* PATCH: Utils-Clipboard#v4.0 ( utils~clipboard-feature ) */
import { exec } from 'child_process';

export const UTILS = {
    clear: () => process.stdout.write('\x1b[2J\x1b[3J\x1b[H'),
    
    strip: (str) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, ""),
    
    visualLength: (str) => {
        const clean = UTILS.strip(str);
        return clean.length;
    },

    truncate: (str, len) => {
        if (!str) return "-";
        str = String(str);
        if (UTILS.visualLength(str) <= len) return str;
        return str.substring(0, len - 1) + "…";
    },

    center: (text, width) => {
        const len = UTILS.visualLength(text);
        if (len >= width) return text;
        const left = Math.floor((width - len) / 2);
        return " ".repeat(left) + text + " ".repeat(width - len - left);
    },

    padRight: (text, width) => {
        const len = UTILS.visualLength(text);
        const pad = Math.max(0, width - len);
        return text + " ".repeat(pad);
    },

    formatUSD: (val) => {
        const num = parseFloat(val);
        if (!num) return "$0.00";
        if (num < 0.000001) return `$${num.toExponential(2)}`;
        if (num < 0.01) return `$${num.toFixed(6)}`;
        return `$${num.toFixed(2)}`;
    },

    formatNumber: (num) => {
        if (!num) return "0";
        if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
        if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
        if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
        return num.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0});
    },

    timeSince: (timestamp) => {
        if (!timestamp) return "Now";
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return "<1m";
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h`;
    },

    progressBar: (pct, width = 10, color = "\x1b[32m") => {
        const safeWidth = Math.max(1, width);
        const filled = Math.max(0, Math.min(safeWidth, Math.floor((pct / 100) * safeWidth)));
        const empty = Math.max(0, safeWidth - filled);
        const bar = "█".repeat(filled) + "\x1b[2m▒\x1b[0m".repeat(empty); 
        return `${color}${bar}\x1b[0m`;
    },

    // --- FITUR BARU: CLIPBOARD ---
    copyToClipboard: (text) => {
        const platform = process.platform;
        let command = '';
        
        if (platform === 'win32') command = `echo ${text} | clip`;
        else if (platform === 'darwin') command = `echo "${text}" | pbcopy`;
        else if (platform === 'android') command = `termux-clipboard-set "${text}"`; // Termux Support
        else command = `echo "${text}" | xclip -selection clipboard`; // Linux fallback

        exec(command, (err) => {
            // Silent fail if tools not installed, but usually works
        });
    }
};
