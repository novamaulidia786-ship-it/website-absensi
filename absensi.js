// Menjalankan fungsi saat halaman selesai dibuka
document.addEventListener("DOMContentLoaded", function () {
    tampilkanData();

    // Ambil tombol Absen
    const tombol = document.querySelector("button");

    // Saat tombol diklik
    tombol.addEventListener("click", tambahAbsensi);
});


// Fungsi untuk menambahkan absensi
function tambahAbsensi() {

    // Mengambil data dari form
    const nama = document.getElementById("nama").value.trim();
    const nim = document.getElementById("nim").value.trim();
    const mataKuliah = document.getElementById("mataKuliah").value;
    const status = document.getElementById("status").value;

    // Mengecek apakah semua data sudah diisi
    if (nama === "" || nim === "" || mataKuliah === "" || status === "") {
        alert("Silakan lengkapi semua data terlebih dahulu!");
        return;
    }

    // Membuat tanggal
    const sekarang = new Date();

    const tanggal =
        String(sekarang.getDate()).padStart(2, "0") + "/" +
        String(sekarang.getMonth() + 1).padStart(2, "0") + "/" +
        sekarang.getFullYear();

    // Membuat data absensi
    const dataBaru = {
        nama: nama,
        nim: nim,
        mataKuliah: mataKuliah,
        status: status,
        tanggal: tanggal
    };

    // Mengambil data lama dari penyimpanan browser
    let dataAbsensi = JSON.parse(localStorage.getItem("dataAbsensi")) || [];

    // Menambahkan data baru
    dataAbsensi.push(dataBaru);

    // Menyimpan kembali data
    localStorage.setItem("dataAbsensi", JSON.stringify(dataAbsensi));

    // Menampilkan data
    tampilkanData();

    // Mengosongkan form
    document.getElementById("nama").value = "";
    document.getElementById("nim").value = "";
    document.getElementById("mataKuliah").value = "";
    document.getElementById("status").value = "";

    // Pesan berhasil
    alert("Absensi berhasil dicatat!");
}


// Fungsi menampilkan data ke tabel
function tampilkanData() {

    const tabel = document.getElementById("dataAbsensi");

    // Kosongkan tabel terlebih dahulu
    tabel.innerHTML = "";

    // Ambil data dari localStorage
    const dataAbsensi =
        JSON.parse(localStorage.getItem("dataAbsensi")) || [];

    // Masukkan setiap data ke tabel
    dataAbsensi.forEach(function (data, index) {

        const baris = tabel.insertRow();

        baris.insertCell(0).textContent = index + 1;
        baris.insertCell(1).textContent = data.nama;
        baris.insertCell(2).textContent = data.nim;
        baris.insertCell(3).textContent = data.mataKuliah;
        baris.insertCell(4).textContent = data.status;
        baris.insertCell(5).textContent = data.tanggal;
    });
}