/* PATCH: UI~Professional#1.7 ( utils~robust-formatting#v2.7 ) */
export const UTILS = {
    clear: () => process.stdout.write('\x1b[2J\x1b[3J\x1b[H'),
    
    // Menghapus ANSI codes untuk hitung panjang murni
    strip: (str) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, ""),
    
    // Menghitung panjang visual (memperhitungkan beberapa emoji lebar)
    visualLength: (str) => {
        const clean = UTILS.strip(str);
        // Estimasi kasar: Karakter ASCII = 1, Lainnya (Emoji/Unicode) ~ 1-2. 
        // Untuk terminal JS simple, .length pada string bersih biasanya cukup akurat 
        // kecuali emoji bendera/complex. Kita pakai length standar clean string agar aman.
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

    // Fungsi canggih untuk mengisi sisa ruang dengan spasi
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
        // Menggunakan block char yang lebih solid
        const bar = "█".repeat(filled) + "\x1b[2m▒\x1b[0m".repeat(empty); 
        return `${color}${bar}\x1b[0m`;
    }
};
