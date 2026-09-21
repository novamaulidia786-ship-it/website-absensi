// ================================================================
// KONFIGURASI
// ================================================================
const WEB_APP_URL =
    'https://script.google.com/macros/s/AKfycbymSSEe8pCfzT8msv8qQfpFg5kQsFh3cZhO8loSpd5WuFXsqBFSQJ2yHco2IG7Gy1jpQA/exec';
const SHEET_URL =
    'https://docs.google.com/spreadsheets/d/1PXOSZAXZNg7hvX-33DglZlM3saj4yclUhiYepiFNYhI/edit?gid=646034675#gid=646034675';
// ================================================================
// STATE
// ================================================================
const AppState = {
    scannerRunning: false,
    flashOn: false,
    isProcessing: false,
    html5QrCode: null,
    mahasiswaData: [],
    isOffline: false,
    debugMode: true,
    isOnline: false
};
// ================================================================
// DOM
// ================================================================
const DOM = {
    status: document.getElementById('status'),
    scanStatus: document.getElementById('scanStatusText'),
    presensiStatus: document.getElementById('presensiStatus'),
    btnStartScan: document.getElementById('btnStartScan'),
    btnFlash: document.getElementById('btnFlash'),
    qrImage: document.getElementById('qrImage'),
    tableBody: document.getElementById('tableBody'),
    dataTable: document.getElementById('dataTable'),
    loadingData: document.getElementById('loadingData'),
    totalMahasiswa: document.getElementById('totalMahasiswa'),
    connectionStatus: document.getElementById('connectionStatus'),
    statusDot: document.getElementById('statusDot'),
    statusLabel: document.getElementById('statusLabel'),
    qrNimInput: document.getElementById('qrNimInput'),
    qrResultImage: document.getElementById('qrResultImage'),
    qrInfo: document.getElementById('qrInfo'),
    qrPreview: document.getElementById('qrPreview')
};
// ================================================================
// DEBUG
// ================================================================
function debugLog(message, type = 'info', data = null) {
    if (!AppState.debugMode) return;
    const timestamp =
        new Date().toLocaleTimeString('id-ID');
    if (data) {
        console.log(`[${timestamp}] ${message}`, data);
    } else {
        console.log(`[${timestamp}] ${message}`);
    }
}
// ================================================================
// CONNECTION STATUS
// ================================================================
function setConnectionStatus(status, message) {
    if (!DOM.statusDot || !DOM.statusLabel) return;
    DOM.statusDot.className = 'dot ' + status;
    DOM.statusLabel.textContent = message;
    AppState.isOnline = status === 'online';
    debugLog(
        `Status: ${status} - ${message}`,
        status
    );
}
// ================================================================
// SHOW STATUS
// ================================================================
function showStatus(
    message,
    type = 'info',
    duration = 4000
) {
    if (!DOM.status) return;
    const iconMap = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-triangle-exclamation',
        info: 'fa-info-circle'
    };
    DOM.status.innerHTML = `
        <i class="fas ${iconMap[type] || iconMap.info}"></i>
        ${message}
    `;
    DOM.status.className = 'status ' + type;
    DOM.status.style.display = 'flex';
    clearTimeout(DOM.status._hideTimeout);
    if (type === 'success' || type === 'error') {
        DOM.status._hideTimeout =
            setTimeout(() => {
                DOM.status.style.display = 'none';
            }, duration);
    }
}
// ================================================================
// CEK KONEKSI
// ================================================================
async function checkConnection() {
    setConnectionStatus(
        'checking',
        'Mengecek koneksi...'
    );
    try {
        const controller =
            new AbortController();
        const timeoutId =
            setTimeout(() => controller.abort(), 5000);
        const response = await fetch(
            WEB_APP_URL + '?action=ping',
            {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json'
                }
            }
        );
        clearTimeout(timeoutId);
        if (response.ok) {
            setConnectionStatus(
                'online',
                '✅ Terhubung ke server'
            );
            return true;
        } else {
            throw new Error(
                'Server tidak merespon'
            );
        }
    } catch (error) {
        console.warn(
            '⚠️ Koneksi offline:',
            error.message
        );
        setConnectionStatus(
            'offline',
            '📴 Offline'
        );
        return false;
    }
}
// ================================================================
// CEK PRESENSI HARI INI
// ================================================================
function checkPresensiHariIni(nim) {
    const presensiData =
        JSON.parse(
            localStorage.getItem(
                'presensiHariIni'
            ) || '{}'
        );
    const today =
        new Date().toLocaleDateString('id-ID');
    return presensiData[nim] === today;
}
// ================================================================
// UPDATE STATUS TABLE
// ================================================================
function updateStatusInTable(nim, hadir) {
    if (!DOM.tableBody) return;
    const rows =
        DOM.tableBody.querySelectorAll('tr');
    rows.forEach(row => {
        const td =
            row.querySelector('td:first-child');
        if (
            td &&
            td.textContent.trim() === nim
        ) {
            const statusTd =
                row.querySelector('td:last-child');
            if (statusTd) {
                statusTd.innerHTML = `
                    <span class="status-hadir">
                        <i class="fas fa-check-circle"></i>
                        Hadir
                    </span>
                `;
            }
        }
    });
}
// ================================================================
// RENDER TABLE
// ================================================================
function renderDataTable(data) {
    if (
        !DOM.tableBody ||
        !DOM.dataTable ||
        !DOM.loadingData
    ) return;
    DOM.tableBody.innerHTML = '';
    if (!data || data.length === 0) {
        DOM.loadingData.innerHTML =
            '<i class="fas fa-info-circle"></i> Tidak ada data';
        DOM.loadingData.style.display = 'block';
        DOM.dataTable.style.display = 'none';
        return;
    }
    data.forEach(mhs => {
        const isHadir =
            checkPresensiHariIni(mhs.nim);
        const row =
            document.createElement('tr');
        row.innerHTML = `
            <td>
                <strong>${mhs.nim || '-'}</strong>
            </td>
            <td>
                ${mhs.nama || '-'}
            </td>
            <td>
                ${mhs.kelas || '-'}
            </td>
            <td>
                ${mhs.jurusan || '-'}
            </td>
            <td>
                <span class="${
                    isHadir
                        ? 'status-hadir'
                        : 'status-belum'
                }">
                    <i class="fas ${
                        isHadir
                            ? 'fa-check-circle'
                            : 'fa-circle'
                    }"></i>
                    ${
                        isHadir
                            ? 'Hadir'
                            : 'Belum'
                    }
                </span>
            </td>
        `;
        DOM.tableBody.appendChild(row);
    });
    DOM.loadingData.style.display = 'none';
    DOM.dataTable.style.display = 'table';
}
// ================================================================
// LOAD DATA MAHASISWA
// ================================================================
async function loadDataMahasiswa() {
    if (
        !DOM.loadingData ||
        !DOM.dataTable ||
        !DOM.tableBody
    ) return;
    DOM.loadingData.style.display = 'block';
    DOM.dataTable.style.display = 'none';
    DOM.loadingData.innerHTML = `
        <i class="fas fa-spinner fa-spin"></i>
        Mengambil data dari Google Sheets...
    `;
    try {
        const isOnline =
            await checkConnection();
        // OFFLINE
        if (!isOnline) {
            const cachedData =
                localStorage.getItem(
                    'mahasiswaData'
                );
            if (cachedData) {
                try {
                    const parsed =
                        JSON.parse(cachedData);
                    if (
                        parsed &&
                        parsed.length > 0
                    ) {
                        AppState.mahasiswaData =
                            parsed;
                        renderDataTable(parsed);
                        DOM.totalMahasiswa.textContent =
                            parsed.length +
                            ' mahasiswa (offline)';
                        showStatus(
                            `📂 ${parsed.length} data dari cache (offline)`,
                            'warning',
                            3000
                        );
                        return;
                    }
                } catch (e) {}
            }
            DOM.loadingData.innerHTML = `
                <i class="fas fa-wifi"
                   style="color:#f87171;font-size:24px;">
                </i>
                <br><br>
                <strong style="color:#f87171;">
                    Tidak Ada Koneksi
                </strong>
                <br><br>
                <span>
                    Tidak ada koneksi internet
                    dan tidak ada data cache.
                </span>
                <br><br>
                <button
                    onclick="loadDataMahasiswa()"
                    style="
                        padding:8px 20px;
                        background:#25d366;
                        color:white;
                        border:none;
                        border-radius:8px;
                        cursor:pointer;
                    "
                >
                    <i class="fas fa-sync-alt"></i>
                    Coba Lagi
                </button>
            `;
            DOM.totalMahasiswa.textContent =
                '0 mahasiswa';
            return;
        }
        // ONLINE
        const response =
            await fetch(
                WEB_APP_URL +
                '?action=get_all',
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    },
                    signal:
                        AbortSignal.timeout(15000)
                }
            );
        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }
        const data =
            await response.json();
        debugLog(
            '📊 Data dari Google Sheets:',
            'info',
            data
        );
        if (
            data &&
            Array.isArray(data) &&
            data.length > 0
        ) {
            AppState.mahasiswaData =
                data;
            localStorage.setItem(
                'mahasiswaData',
                JSON.stringify(data)
            );
            renderDataTable(data);
            DOM.totalMahasiswa.textContent =
                data.length +
                ' mahasiswa';
            setConnectionStatus(
                'online',
                '✅ Online - Data dari Google Sheets'
            );
            showStatus(
                `✅ ${data.length} data mahasiswa dari Google Sheets!`,
                'success',
                3000
            );
            return;
        }
        // DATA KOSONG
        const cachedData =
            localStorage.getItem(
                'mahasiswaData'
            );
        if (cachedData) {
            try {
                const parsed =
                    JSON.parse(cachedData);
                if (
                    parsed &&
                    parsed.length > 0
                ) {
                    AppState.mahasiswaData =
                        parsed;
                    renderDataTable(parsed);
                    DOM.totalMahasiswa.textContent =
                        parsed.length +
                        ' mahasiswa (cache)';
                    showStatus(
                        `📂 ${parsed.length} data dari cache`,
                        'warning',
                        3000
                    );
                    return;
                }
            } catch (e) {}
        }
        DOM.loadingData.innerHTML = `
            <i class="fas fa-info-circle"
               style="color:#fbbf24;font-size:20px;">
            </i>
            <br><br>
            <strong style="color:#fbbf24;">
                Belum ada data di Google Sheets
            </strong>
            <br><br>
            Silakan tambahkan data mahasiswa
            di Google Sheets terlebih dahulu.
            <br><br>
            <a
                href="${SHEET_URL}"
                target="_blank"
                style="
                    padding:8px 20px;
                    background:#25d366;
                    color:white;
                    border-radius:8px;
                    text-decoration:none;
                    display:inline-block;
                "
            >
                <i class="fas fa-external-link-alt"></i>
                Buka Google Sheets
            </a>
        `;
        DOM.totalMahasiswa.textContent =
            '0 mahasiswa';
    } catch (error) {
        console.error(
            '❌ Error:',
            error
        );
        const cachedData =
            localStorage.getItem(
                'mahasiswaData'
            );
        if (cachedData) {
            try {
                const parsed =
                    JSON.parse(cachedData);
                if (
                    parsed &&
                    parsed.length > 0
                ) {
                    AppState.mahasiswaData =
                        parsed;
                    renderDataTable(parsed);
                    DOM.totalMahasiswa.textContent =
                        parsed.length +
                        ' mahasiswa (cache)';
                    showStatus(
                        `📂 ${parsed.length} data dari cache`,
                        'warning',
                        3000
                    );
                    return;
                }
            } catch (e) {}
        }
        DOM.loadingData.innerHTML = `
            <i class="fas fa-exclamation-circle"
               style="color:#ef4444;font-size:24px;">
            </i>
            <br><br>
            <strong style="color:#ef4444;">
                Gagal Memuat Data
            </strong>
            <br><br>
            ${error.message}
            <br><br>
            <button
                onclick="loadDataMahasiswa()"
                style="
                    padding:8px 20px;
                    background:#25d366;
                    color:white;
                    border:none;
                    border-radius:8px;
                    cursor:pointer;
                "
            >
                <i class="fas fa-sync-alt"></i>
                Coba Lagi
            </button>
        `;
        DOM.totalMahasiswa.textContent =
            '0 mahasiswa';
        setConnectionStatus(
            'offline',
            '❌ Gagal terhubung'
        );
    }
}
// ================================================================
// GENERATE QR UTAMA
// ================================================================
function generateQR() {
    if (!DOM.qrImage) return;
    const qrData = {
        nim: 'ABSENSI-KELAS',
        nama: 'Presensi Kelas',
        kelas: 'Semua',
        jurusan: 'Semua',
        link_sheet: SHEET_URL,
        timestamp:
            new Date().toISOString()
    };
    const qrText =
        JSON.stringify(qrData);
    DOM.qrImage.src =
        `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrText)}`;
}
// ================================================================
// DOWNLOAD QR UTAMA
// ================================================================
function downloadQR() {
    if (!DOM.qrImage.src) {
        alert(
            'QR Code belum siap.'
        );
        return;
    }
    const link =
        document.createElement('a');
    link.download =
        'qr-presensi-kelas.png';
    link.href =
        DOM.qrImage.src;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
// ================================================================
// GENERATE QR MAHASISWA
// ================================================================
function generateQRCode() {
    const nim =
        DOM.qrNimInput.value.trim();
    if (!nim) {
        showStatus(
            '❌ Masukkan NIM terlebih dahulu',
            'error'
        );
        DOM.qrNimInput.focus();
        return;
    }
    if (nim.length < 3) {
        showStatus(
            '❌ NIM minimal 3 karakter',
            'error'
        );
        return;
    }
    const mahasiswa =
        AppState.mahasiswaData.find(
            m => m.nim === nim
        );
    if (!mahasiswa) {
        showStatus(
            `❌ NIM ${nim} tidak terdaftar!`,
            'error'
        );
        return;
    }
    const qrData = {
        nim: mahasiswa.nim,
        nama: mahasiswa.nama,
        kelas: mahasiswa.kelas,
        jurusan: mahasiswa.jurusan,
        link_sheet: SHEET_URL,
        timestamp:
            new Date().toISOString()
    };
    const qrText =
        JSON.stringify(qrData);
    const qrUrl =
        `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrText)}`;
    DOM.qrResultImage.src =
        qrUrl;
    DOM.qrInfo.innerHTML = `
        <strong>NIM:</strong>
        ${mahasiswa.nim}
        &bull;
        <strong>Nama:</strong>
        ${mahasiswa.nama}
        &bull;
        <strong>Kelas:</strong>
        ${mahasiswa.kelas}
        &bull;
        <strong>Jurusan:</strong>
        ${mahasiswa.jurusan}
        <div style="
            margin-top:6px;
            font-size:12px;
            color:#25d366;
        ">
            <i class="fas fa-check-circle"></i>
            Scan QR untuk presensi
        </div>
    `;
    DOM.qrPreview.classList.add(
        'show'
    );
    showStatus(
        `✅ QR Code berhasil dibuat untuk ${mahasiswa.nama} (${nim})`,
        'success'
    );
}
// ================================================================
// DOWNLOAD QR MAHASISWA
// ================================================================
function downloadQRCode() {
    if (!DOM.qrResultImage.src) {
        showStatus(
            '❌ Tidak ada QR Code untuk didownload',
            'error'
        );
        return;
    }
    const link =
        document.createElement('a');
    const nim =
        DOM.qrNimInput.value.trim()
        || 'mahasiswa';
    link.download =
        `qr-code-${nim}.png`;
    link.href =
        DOM.qrResultImage.src;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showStatus(
        '✅ QR Code berhasil didownload!',
        'success'
    );
}
// ================================================================
// CLOSE QR PREVIEW
// ================================================================
function closeQRPreview() {
    DOM.qrPreview.classList.remove(
        'show'
    );
    DOM.qrNimInput.value = '';
}
// ================================================================
// SCANNER
// ================================================================
function toggleScanner() {
    if (AppState.scannerRunning) {
        stopScanner();
    } else {
        startScanner();
    }
}
// ================================================================
// START SCANNER
// ================================================================
function startScanner() {
    if (AppState.scannerRunning)
        return;
    if (AppState.html5QrCode) {
        try {
            AppState.html5QrCode.clear();
            AppState.html5QrCode = null;
        } catch (e) {}
    }
    const readerElement =
        document.getElementById(
            'qr-reader'
        );
    if (readerElement) {
        readerElement.innerHTML = '';
    }
    DOM.btnStartScan.classList.add(
        'stop'
    );
    DOM.btnStartScan.innerHTML = `
        <i class="fas fa-stop"></i>
        <span id="btnScanLabel">
            Stop Scan
        </span>
    `;
    try {
        AppState.html5QrCode =
            new Html5Qrcode(
                "qr-reader",
                {
                    verbose: false,
                    formatsToSupport: [
                        Html5QrcodeSupportedFormats.QR_CODE
                    ]
                }
            );
        const config = {
            fps: 10,
            qrbox: {
                width: 250,
                height: 250
            },
            aspectRatio: 1.0
        };
        AppState.html5QrCode.start(
            {
                facingMode: "environment"
            },
            config,
            onScanSuccess,
            onScanError
        ).then(() => {
            AppState.scannerRunning = true;
            DOM.scanStatus.textContent =
                '🔍 Mendeteksi QR Code...';
            DOM.presensiStatus.textContent =
                'Mendeteksi...';
            showStatus(
                '📷 Kamera aktif',
                'info',
                3000
            );
        }).catch(() => {
            AppState.html5QrCode.start(
                {
                    facingMode: "user"
                },
                config,
                onScanSuccess,
                onScanError
            ).then(() => {
                AppState.scannerRunning = true;
                DOM.scanStatus.textContent =
                    '🔍 Mendeteksi QR Code...';
                showStatus(
                    '📷 Kamera depan aktif',
                    'info',
                    3000
                );
            }).catch(err2 => {
                showStatus(
                    '❌ Gagal akses kamera: ' +
                    err2.message,
                    'error'
                );
                resetScannerButton();
            });
        });
    } catch (error) {
        showStatus(
            '❌ Gagal inisialisasi scanner',
            'error'
        );
        resetScannerButton();
    }
}
// ================================================================
// SCAN ERROR
// ================================================================
function onScanError(errorMessage) {
    // Error scan biasa diabaikan
}
// ================================================================
// STOP SCANNER
// ================================================================
function stopScanner() {
    if (
        AppState.html5QrCode &&
        AppState.scannerRunning
    ) {
        AppState.html5QrCode
            .stop()
            .then(() => {
                AppState.html5QrCode.clear();
                AppState.html5QrCode =
                    null;
                AppState.scannerRunning =
                    false;
                resetScannerButton();
                DOM.scanStatus.textContent =
                    '⏸ Scanner berhenti';
                DOM.presensiStatus.textContent =
                    'Scanner berhenti';
            })
            .catch(() => {});
    } else {
        AppState.scannerRunning =
            false;
        resetScannerButton();
    }
}
// ================================================================
// RESET BUTTON
// ================================================================
function resetScannerButton() {
    if (!DOM.btnStartScan)
        return;
    DOM.btnStartScan.classList.remove(
        'stop'
    );
    DOM.btnStartScan.innerHTML = `
        <i class="fas fa-play"></i>
        <span id="btnScanLabel">
            Mulai Scan
        </span>
    `;
}
// ================================================================
// SCAN SUCCESS
// ================================================================
function onScanSuccess(decodedText) {
    if (AppState.isProcessing)
        return;
    AppState.isProcessing = true;
    if (
        AppState.html5QrCode &&
        AppState.scannerRunning
    ) {
        AppState.html5QrCode
            .stop()
            .then(() => {
                AppState.scannerRunning =
                    false;
                resetScannerButton();
            })
            .catch(() => {});
    }
    processPresensi(decodedText);
}
// ================================================================
// PROSES PRESENSI
// ================================================================
async function processPresensi(qrData) {
    try {
        showStatus(
            '⏳ Memproses presensi...',
            'info',
            5000
        );
        let data;
        let nim = '';
        try {
            data =
                JSON.parse(qrData);
            nim =
                data.nim || '';
        } catch (e) {
            nim =
                qrData.trim();
            data = {
                nim: nim
            };
        }
        if (
            !nim ||
            nim.length < 3
        ) {
            showStatus(
                '❌ NIM tidak valid',
                'error'
            );
            AppState.isProcessing =
                false;
            setTimeout(
                startScanner,
                2000
            );
            return;
        }
        const mahasiswa =
            AppState.mahasiswaData.find(
                m => m.nim === nim
            );
        if (!mahasiswa) {
            showStatus(
                `❌ NIM ${nim} tidak terdaftar!`,
                'error'
            );
            AppState.isProcessing =
                false;
            setTimeout(
                startScanner,
                2000
            );
            return;
        }
        const today =
            new Date()
                .toLocaleDateString(
                    'id-ID'
                );
        const presensiData =
            JSON.parse(
                localStorage.getItem(
                    'presensiHariIni'
                ) || '{}'
            );
        if (
            presensiData[nim] === today
        ) {
            showStatus(
                `⚠️ ${mahasiswa.nama} sudah presensi hari ini!`,
                'warning'
            );
            DOM.scanStatus.textContent =
                '⚠️ Sudah presensi';
            DOM.presensiStatus.textContent =
                '⚠️ Sudah hadir';
            AppState.isProcessing =
                false;
            setTimeout(
                startScanner,
                2000
            );
            return;
        }
        // PAYLOAD
        const payload = {
            action: 'presensi',
            nim: nim,
            nama:
                mahasiswa.nama || '',
            kelas:
                mahasiswa.kelas || '',
            jurusan:
                mahasiswa.jurusan || '',
            mataKuliah:
                'Presensi Kelas',
            status:
                'Hadir',
            waktu:
                new Date().toLocaleString(
                    'id-ID',
                    {
                        timeZone:
                            'Asia/Jakarta'
                    }
                )
        };
        // KIRIM KE GOOGLE SHEETS
        await fetch(
            WEB_APP_URL,
            {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type':
                        'application/json'
                },
                body:
                    JSON.stringify(payload)
            }
        );
        // LOCAL STORAGE
        presensiData[nim] =
            today;
        localStorage.setItem(
            'presensiHariIni',
            JSON.stringify(
                presensiData
            )
        );
        // SUKSES
        showStatus(
            `✅ ${mahasiswa.nama} HADIR!`,
            'success'
        );
        DOM.scanStatus.textContent =
            '✅ Hadir!';
        DOM.presensiStatus.textContent =
            '✅ Hadir';
        updateStatusInTable(
            nim,
            true
        );
        // REFRESH DATA
        setTimeout(() => {
            loadDataMahasiswa();
        }, 500);
    } catch (error) {
        console.error(
            '❌ Error processing presensi:',
            error
        );
        showStatus(
            `❌ Error: ${error.message}`,
            'error'
        );
        DOM.scanStatus.textContent =
            '❌ Error';
        DOM.presensiStatus.textContent =
            '❌ Error';
    } finally {
        setTimeout(() => {
            AppState.isProcessing =
                false;
            DOM.scanStatus.textContent =
                'Arahkan ke QR Code';
            if (
                !AppState.scannerRunning
            ) {
                startScanner();
            }
        }, 3000);
    }
}
// ================================================================
// FLASH
// ================================================================
function toggleFlash() {
    AppState.flashOn =
        !AppState.flashOn;
    if (!DOM.btnFlash)
        return;
    if (AppState.flashOn) {
        DOM.btnFlash.classList.add(
            'active'
        );
        DOM.btnFlash.innerHTML =
            '<i class="fas fa-bolt"></i>';
        try {
            const video =
                AppState
                    .html5QrCode
                    ?._videoElement;
            const track =
                video
                    ?.srcObject
                    ?.getVideoTracks()[0];
            if (
                track &&
                track.getCapabilities?.()
                    .torch
            ) {
                track.applyConstraints({
                    advanced: [
                        {
                            torch: true
                        }
                    ]
                });
            }
        } catch (e) {}
    } else {
        DOM.btnFlash.classList.remove(
            'active'
        );
        DOM.btnFlash.innerHTML =
            '<i class="fas fa-bolt"></i>';
        try {
            const video =
                AppState
                    .html5QrCode
                    ?._videoElement;
            const track =
                video
                    ?.srcObject
                    ?.getVideoTracks()[0];
            if (
                track &&
                track.getCapabilities?.()
                    .torch
            ) {
                track.applyConstraints({
                    advanced: [
                        {
                            torch: false
                        }
                    ]
                });
            }
        } catch (e) {}
    }
}
// ================================================================
// CHECK CAMERA
// ================================================================
async function checkCameraPermission() {
    try {
        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices
                .getUserMedia
        ) {
            showStatus(
                '❌ Browser tidak mendukung kamera',
                'error'
            );
            return false;
        }
        const stream =
            await navigator.mediaDevices
                .getUserMedia({
                    video: {
                        facingMode:
                            "environment"
                    }
                });
        stream
            .getTracks()
            .forEach(
                track =>
                    track.stop()
            );
        return true;
    } catch (error) {
        showStatus(
            '❌ Izin kamera diperlukan untuk scan QR Code',
            'error'
        );
        return false;
    }
}
// ================================================================
// INIT
// ================================================================
async function init() {
    console.log(
        '📱 Aplikasi Presensi Kelas v3.0'
    );
    console.log(
        '📡 Web App URL:',
        WEB_APP_URL
    );
    generateQR();
    DOM.presensiStatus.textContent =
        'Menunggu scan...';
    await checkConnection();
    await loadDataMahasiswa();
    setInterval(
        loadDataMahasiswa,
        30000
    );
    const cameraReady =
        await checkCameraPermission();
    if (cameraReady) {
        setTimeout(
            startScanner,
            800
        );
    } else {
        showStatus(
            '❌ Izin kamera diperlukan untuk scan QR Code',
            'error'
        );
    }
}
// ================================================================
// DOM READY
// ================================================================
document.addEventListener(
    'DOMContentLoaded',
    init
);
// ================================================================
// BEFORE UNLOAD
// ================================================================
window.addEventListener(
    'beforeunload',
    function () {
        if (
            AppState.html5QrCode &&
            AppState.scannerRunning
        ) {
            AppState.html5QrCode
                .stop()
                .then(() => {
                    AppState.html5QrCode
                        .clear();
                    AppState.html5QrCode =
                        null;
                })
                .catch(() => {});
        }
    }
);