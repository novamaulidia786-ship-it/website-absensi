const WEB_APP_URL =
    'https://script.google.com/macros/s/AKfycbymSSEe8pCfzT8msv8qQfpFg5kQsFh3cZhO8loSpd5WuFXsqBFSQJ2yHco2IG7Gy1jpQA/exec';

const SHEET_URL =
    'https://docs.google.com/spreadsheets/d/1PXOSZAXZNg7hvX-33DglZlM3saj4yclUhiYepiFNYhI/edit?gid=646034675#gid=646034675';


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


function debugLog(message, type = 'info', data = null) {

    if (!AppState.debugMode) return;

    const timestamp = new Date().toLocaleTimeString('id-ID');

    if (data) {
        console.log(`[${timestamp}] ${message}`, data);
    } else {
        console.log(`[${timestamp}] ${message}`);
    }
}


function setConnectionStatus(status, message) {

    if (!DOM.statusDot || !DOM.statusLabel) return;

    DOM.statusDot.className = 'dot ' + status;
    DOM.statusLabel.textContent = message;

    AppState.isOnline = status === 'online';

    debugLog(`Status: ${status} - ${message}`, status);
}


function showStatus(message, type = 'info', duration = 4000) {

    if (!DOM.status) return;

    const iconMap = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-triangle-exclamation',
        info: 'fa-info-circle'
    };

    DOM.status.innerHTML =
        `<i class="fas ${iconMap[type] || iconMap.info}"></i> ${message}`;

    DOM.status.className = 'status ' + type;

    DOM.status.style.display = 'flex';

    clearTimeout(DOM.status._hideTimeout);

    if (type === 'success' || type === 'error') {

        DOM.status._hideTimeout = setTimeout(() => {
            DOM.status.style.display = 'none';
        }, duration);

    }
}


async function checkConnection() {

    setConnectionStatus(
        'checking',
        'Mengecek koneksi...'
    );

    try {

        const controller = new AbortController();

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
            <td><strong>${mhs.nim || '-'}</strong></td>

            <td>${mhs.nama || '-'}</td>

            <td>${mhs.kelas || '-'}</td>

            <td>${mhs.jurusan || '-'}</td>

            <td>
                <span class="${isHadir ? 'status-hadir' : 'status-belum'}">

                    <i class="fas ${
                        isHadir
                            ? 'fa-check-circle'
                            : 'fa-circle'
                    }"></i>

                    ${isHadir ? 'Hadir' : 'Belum'}

                </span>
            </td>
        `;

        DOM.tableBody.appendChild(row);

    });


    DOM.loadingData.style.display = 'none';
    DOM.dataTable.style.display = 'table';
}


async function loadDataMahasiswa() {

    if (
        !DOM.loadingData ||
        !DOM.dataTable ||
        !DOM.tableBody
    ) return;

    DOM.loadingData.style.display = 'block';
    DOM.dataTable.style.display = 'none';

    DOM.loadingData.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Mengambil data dari Google Sheets...';


    try {

        const isOnline =
            await checkConnection();


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

                        DOM.loadingData.style.display =
                            'none';

                        DOM.dataTable.style.display =
                            'table';

                        showStatus(
                            `📂 ${parsed.length} data dari cache (offline)`,
                            'warning',
                            3000
                        );

                        return;
                    }

                } catch (e) {}

            }

            DOM.loadingData.innerHTML =
                'Tidak ada koneksi internet dan tidak ada data cache.';

            DOM.totalMahasiswa.textContent =
                '0 mahasiswa';

            return;
        }


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


        DOM.loadingData.innerHTML =
            'Belum ada data di Google Sheets.';

        DOM.totalMahasiswa.textContent =
            '0 mahasiswa';


    } catch (error) {

        console.error(
            '❌ Error:',
            error
        );

        DOM.loadingData.innerHTML =
            `
            <strong>Gagal Memuat Data</strong>
            <br><br>
            ${error.message}
            <br><br>
            Pastikan Web App sudah di-deploy dan URL benar.
            `;

        DOM.totalMahasiswa.textContent =
            '0 mahasiswa';

        setConnectionStatus(
            'offline',
            '❌ Gagal terhubung'
        );

    }
}


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
        <strong>NIM:</strong> ${mahasiswa.nim}
        &bull;
        <strong>Nama:</strong> ${mahasiswa.nama}
        &bull;
        <strong>Kelas:</strong> ${mahasiswa.kelas}
        &bull;
        <strong>Jurusan:</strong> ${mahasiswa.jurusan}
    `;


    DOM.qrPreview.classList.add(
        'show'
    );


    showStatus(
        `✅ QR Code berhasil dibuat untuk ${mahasiswa.nama}`,
        'success'
    );
}


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
        DOM.qrNimInput.value.trim() ||
        'mahasiswa';

    link.download =
        `qr-code-${nim}.png`;

    link.href =
        DOM.qrResultImage.src;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
}


function closeQRPreview() {

    DOM.qrPreview.classList.remove(
        'show'
    );

    DOM.qrNimInput.value = '';
}


function toggleScanner() {

    if (AppState.scannerRunning) {

        stopScanner();

    } else {

        startScanner();

    }
}


function startScanner() {

    if (AppState.scannerRunning) return;


    const readerElement =
        document.getElementById(
            'qr-reader'
        );


    if (readerElement) {

        readerElement.innerHTML = '';

    }


    if (DOM.btnStartScan) {

        DOM.btnStartScan.classList.add(
            'stop'
        );

        DOM.btnStartScan.innerHTML =
            '<i class="fas fa-stop"></i> Stop Scan';

    }


    try {

        AppState.html5QrCode =
            new Html5Qrcode(
                'qr-reader',
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
                facingMode: 'environment'
            },

            config,

            onScanSuccess,

            onScanError

        ).then(() => {

            AppState.scannerRunning =
                true;

            DOM.scanStatus.textContent =
                '🔍 Mendeteksi QR Code...';

            showStatus(
                '📷 Kamera aktif',
                'info',
                3000
            );

        }).catch(error => {

            showStatus(
                '❌ Gagal akses kamera: ' +
                error.message,
                'error'
            );

            resetScannerButton();

        });


    } catch (error) {

        showStatus(
            '❌ Gagal inisialisasi scanner',
            'error'
        );

        resetScannerButton();

    }
}


function onScanError(errorMessage) {
    // Error scan biasa diabaikan
}


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

            });

    } else {

        AppState.scannerRunning =
            false;

        resetScannerButton();

    }
}


function resetScannerButton() {

    if (!DOM.btnStartScan) return;

    DOM.btnStartScan.classList.remove(
        'stop'
    );

    DOM.btnStartScan.innerHTML =
        '<i class="fas fa-play"></i> <span id="btnScanLabel">Mulai Scan</span>';

}


function onScanSuccess(decodedText) {

    if (AppState.isProcessing) return;

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

            });

    }


    processPresensi(decodedText);
}


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


        const today =
            new Date().toLocaleDateString(
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

            return;
        }


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
                    JSON.stringify(
                        payload
                    )
            }
        );


        presensiData[nim] =
            today;


        localStorage.setItem(
            'presensiHariIni',
            JSON.stringify(
                presensiData
            )
        );


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


        setTimeout(
            loadDataMahasiswa,
            500
        );


    } catch (error) {

        console.error(
            '❌ Error:',
            error
        );

        showStatus(
            `❌ Error: ${error.message}`,
            'error'
        );

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


function toggleFlash() {

    AppState.flashOn =
        !AppState.flashOn;


    if (!DOM.btnFlash) return;


    if (AppState.flashOn) {

        DOM.btnFlash.classList.add(
            'active'
        );

        DOM.btnFlash.innerHTML =
            '<i class="fas fa-bolt"></i>';

    } else {

        DOM.btnFlash.classList.remove(
            'active'
        );

        DOM.btnFlash.innerHTML =
            '<i class="fas fa-bolt"></i>';

    }
}


async function checkCameraPermission() {

    try {

        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {

            showStatus(
                '❌ Browser tidak mendukung kamera',
                'error'
            );

            return false;
        }


        const stream =
            await navigator.mediaDevices.getUserMedia(
                {
                    video: {
                        facingMode:
                            'environment'
                    }
                }
            );


        stream
            .getTracks()
            .forEach(track =>
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


async function init() {

    console.log(
        '📱 Aplikasi Presensi Kelas v3.0'
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

    }

}


document.addEventListener(
    'DOMContentLoaded',
    init
);


window.addEventListener(
    'beforeunload',
    function () {

        if (
            AppState.html5QrCode &&
            AppState.scannerRunning
        ) {

            AppState.html5QrCode
                .stop()
                .catch(() => {});

        }

    }
);