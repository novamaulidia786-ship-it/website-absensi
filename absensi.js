/* =========================
   DATA MAHASISWA
========================= */

const mahasiswa = [
    {
        nim: "24105111107",
        nama: "Yazra"
    },
    {
        nim: "24105111110",
        nama: "Khalisa huemaiira"
    },
    {
        nim: "24105111106",
        nama: "Nova maulidia"
    },
    {
        nim: "24105111103",
        nama: "Safira al syifa"
    },
    {
        nim: "2410511105",
        nama: "Nazirah fonna"
    }
];

/* =========================
   DATA ABSENSI
========================= */

let dataAbsen = JSON.parse(
    localStorage.getItem("dataAbsen")
) || [];

/* =========================
   TAMPILKAN DATA
========================= */

function tampilkanData() {

    const tabel = document.getElementById("tabelMahasiswa");

    tabel.innerHTML = "";

    dataAbsen.forEach((data, index) => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${data.nim}</td>
            <td>${data.nama}</td>
        `;

        tabel.appendChild(row);
    });

    document.getElementById("totalAbsen").textContent =
        dataAbsen.length;
}

/* =========================
   BUAT QR
========================= */

function buatQR() {

    const nimInput =
        document.getElementById("nim");

    const nim =
        nimInput.value.trim();

    if (nim === "") {

        alert("Silakan masukkan NIM terlebih dahulu.");

        return;
    }

    const data =
        mahasiswa.find(
            m => m.nim === nim
        );

    if (!data) {

        alert(
            "NIM tidak ditemukan. Pastikan NIM sudah terdaftar."
        );

        return;
    }

    document.getElementById("qrSection")
        .classList.remove("hidden");

    document.getElementById("qrcode")
        .innerHTML = "";

    const isiQR = JSON.stringify({
        nim: data.nim,
        nama: data.nama
    });

    new QRCode(
        document.getElementById("qrcode"),
        {
            text: isiQR,
            width: 220,
            height: 220
        }
    );

    document.getElementById("qrNama").innerHTML =
        `NIM: ${data.nim}<br>Nama: ${data.nama}`;

    document.getElementById("qrSection")
        .scrollIntoView({
            behavior: "smooth"
        });
}

/* =========================
   SCANNER
========================= */

let scanner = null;

function tampilkanScanner() {

    const section =
        document.getElementById("scannerSection");

    section.classList.remove("hidden");

    section.scrollIntoView({
        behavior: "smooth"
    });

    mulaiScanner();
}

function mulaiScanner() {

    if (scanner !== null) {
        return;
    }

    scanner = new Html5Qrcode("reader");

    scanner.start(

        {
            facingMode: "environment"
        },

        {
            fps: 10,
            qrbox: {
                width: 250,
                height: 250
            }
        },

        qrCodeMessage => {

            prosesAbsensi(qrCodeMessage);

        },

        errorMessage => {

            // Abaikan error scanning sementara

        }

    ).catch(error => {

        console.log(error);

        document.getElementById("scanResult").innerHTML =
            "❌ Kamera tidak dapat digunakan.";

    });
}

/* =========================
   PROSES ABSENSI
========================= */

function prosesAbsensi(qrData) {

    try {

        const data =
            JSON.parse(qrData);

        const sudahAbsen =
            dataAbsen.some(
                item => item.nim === data.nim
            );

        if (sudahAbsen) {

            document.getElementById("scanResult").innerHTML =
                "⚠️ Mahasiswa ini sudah melakukan absensi.";

            return;
        }

        dataAbsen.push({

            nim: data.nim,

            nama: data.nama,

            waktu: new Date()
                .toLocaleString("id-ID")

        });

        localStorage.setItem(
            "dataAbsen",
            JSON.stringify(dataAbsen)
        );

        tampilkanData();

        document.getElementById("scanResult").innerHTML =

            `✅ Absensi berhasil!<br>
             ${data.nama}<br>
             NIM: ${data.nim}`;

        if (scanner !== null) {

            scanner.stop()
                .then(() => {

                    scanner.clear();

                    scanner = null;

                });

        }

    }

    catch (error) {

        document.getElementById("scanResult").innerHTML =
            "❌ QR Code tidak valid.";

    }
}

/* =========================
   JALANKAN SAAT HALAMAN DIBUKA
========================= */

tampilkanData();