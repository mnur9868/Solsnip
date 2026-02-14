#!/bin/bash

# ==========================================
# Node.js Dependency Auto-Scanner & Installer
# ==========================================

# Warna untuk output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}[*] Memulai analisis file Node.js...${NC}"

# 1. Inisialisasi file sementara
TEMP_FILE=$(mktemp)

# 2. Daftar modul bawaan Node.js (Core Modules) agar tidak ikut diinstall
#    Daftar ini mencakup modul standar Node.js terbaru.
CORE_MODULES="assert|async_hooks|buffer|child_process|cluster|console|constants|crypto|dgram|dns|domain|events|fs|http|http2|https|inspector|module|net|os|path|perf_hooks|process|punycode|querystring|readline|repl|stream|string_decoder|sys|timers|tls|trace_events|tty|url|util|v8|vm|wasi|worker_threads|zlib"

# 3. Fungsi untuk mengekstrak nama package
extract_packages() {
    # Mencari semua file js, mjs, cjs, ts, jsx, tsx
    find . -type f \( -name "*.js" -o -name "*.mjs" -o -name "*.cjs" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" \) -not -path "*/node_modules/*" | while read -r file; do
        
        # Menggunakan grep dengan PCRE regex untuk menangkap isi dari require/import
        # Pola yang ditangkap:
        # - require('x') atau require("x")
        # - from 'x' atau from "x"
        # - import 'x' (untuk side-effects)
        # - import('x') (dynamic import)
        grep -oP "(require\s*\(\s*['\"]\K[^'\"]+)|(from\s+['\"]\K[^'\"]+)|(import\s*\(\s*['\"]\K[^'\"]+)|(^import\s+['\"]\K[^'\"]+)" "$file" >> "$TEMP_FILE"
    done
}

# Jalankan ekstraksi
extract_packages

# 4. Proses daftar package
# - Urutkan dan hapus duplikat
# - Hapus modul core Node.js
# - Hapus relative path (./ atau ../ atau /)
PACKAGES_TO_INSTALL=$(sort -u "$TEMP_FILE" | \
    grep -vE "^($CORE_MODULES)$" | \
    grep -vE "^\.|^/" | \
    awk -F/ '{
        # Logika untuk menangani Scoped Packages (@org/pkg) vs Regular Packages (pkg/subpath)
        if ($1 ~ /^@/) {
            print $1 "/" $2 
        } else {
            print $1
        }
    }' | sort -u)

# Hapus file sementara
rm "$TEMP_FILE"

# 5. Cek apakah ada package yang ditemukan
if [ -z "$PACKAGES_TO_INSTALL" ]; then
    echo -e "${YELLOW}[!] Tidak ditemukan library eksternal untuk diinstal.${NC}"
    exit 0
fi

echo -e "${GREEN}[+] Library teridentifikasi:${NC}"
echo "$PACKAGES_TO_INSTALL"
echo "----------------------------------------"

# 6. Persiapan Instalasi
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}[!] package.json tidak ditemukan. Membuat inisialisasi npm init -y...${NC}"
    npm init -y > /dev/null
fi

# Konfirmasi User
echo -e "${YELLOW}[?] Apakah Anda ingin menginstal library di atas? (y/n)${NC}"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "${GREEN}[*] Menginstal packages...${NC}"
    
    # Mengubah baris baru menjadi spasi untuk perintah npm install
    INSTALL_LIST=$(echo "$PACKAGES_TO_INSTALL" | tr '\n' ' ')
    
    # Eksekusi install
    npm install $INSTALL_LIST
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[SUCCESS] Semua library berhasil diinstal!${NC}"
    else
        echo -e "${RED}[ERROR] Terjadi kesalahan saat instalasi.${NC}"
    fi
else
    echo -e "${RED}[X] Instalasi dibatalkan.${NC}"
fi
npm pkg set type="module" > /dev/null
