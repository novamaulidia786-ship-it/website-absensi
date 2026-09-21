// ================================================================
// KONFIGURASI
// ================================================================

const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbymSSEe8pCfzT8msv8qQfpFg5kQsFh3cZhO8loSpd5WuFXsqBFSQJ2yHco2IG7Gy1jpQA/exec';

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1PXOSZAXZNg7hvX-33DglZlM3saj4yclUhiYepiFNYhI/edit?gid=646034675#gid=646034675';
const AppState = {
    window.addEventListener('beforeunload', function() {
    if (AppState.html5QrCode && AppState.scannerRunning) {
        AppState.html5QrCode.stop().then(() => {
            AppState.html5QrCode.clear();
            AppState.html5QrCode = null;
        }).catch(() => {});
    }
});