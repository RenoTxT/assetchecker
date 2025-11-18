<script setup>
// 1. Impor 'onMounted' dan 'onBeforeUnmount' dari Vue
// dan 'Html5QrcodeScanner' dari library baru kita
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { Html5QrcodeScanner } from 'html5-qrcode'

const router = useRouter()
const scanInput = ref('') // Ini untuk input manual/fallback

// 2. Variabel untuk menyimpan instance scanner
const scanner = ref(null)

// 3. Fungsi untuk mem-parsing ID dan pindah halaman
// Kita akan panggil ini dari 2 tempat:
// (A) dari hasil scan, (B) dari input manual
function navigateToAsset(scannedText) {
  if (!scannedText) return

  let assetId = ''
  if (scannedText.includes(':')) {
    assetId = scannedText.split(':')[1].trim()
  } else {
    assetId = scannedText.trim()
  }

  if (assetId && assetId.length >= 12) {
    // Hentikan scanner SEBELUM pindah halaman
    stopScanner()

    // Pindah ke halaman detail
    router.push({ name: 'asset-detail', params: { id: assetId } })
  }
}

// 4. Fungsi 'watch' untuk input manual (fallback)
watch(scanInput, (newScanValue) => {
  // Jika ada input manual, kita panggil fungsi yang sama
  navigateToAsset(newScanValue)
})

// 5. Ini adalah fungsi yang dipanggil library saat scan BERHASIL
function onScanSuccess(decodedText, decodedResult) {
  console.log(`Scan berhasil: ${decodedText}`, decodedResult)

  // Panggil fungsi navigasi kita
  navigateToAsset(decodedText)
}

// Fungsi yang dipanggil saat scan GAGAL (opsional)
function onScanFailure(error) {
  // console.warn(`Scan Gagal, error: ${error}`)
  // Biarkan saja, scanner akan terus mencoba
}

// 6. Fungsi untuk menghentikan scanner & mematikan kamera
function stopScanner() {
  if (scanner.value) {
    scanner.value.clear() // Hentikan scan & matikan kamera
    console.log('Scanner dihentikan.')
  }
}

// 7. 'onMounted' berjalan saat halaman dimuat
onMounted(() => {
  // Konfigurasi scanner
  const config = {
    fps: 10, // 10 frame per second
    qrbox: { width: 250, height: 250 }, // Ukuran kotak bidik
    rememberLastUsedCamera: true,
  }

  // Buat instance scanner baru
  scanner.value = new Html5QrcodeScanner(
    'qr-reader', // ID dari elemen <div> di template
    config,
    /* verbose= */ false,
  )

  // Mulai render scanner
  scanner.value.render(onScanSuccess, onScanFailure)
  console.log('Scanner QR dimulai...')
})

// 8. 'onBeforeUnmount' berjalan saat kita meninggalkan halaman
// Ini SANGAT PENTING untuk mematikan kamera
onBeforeUnmount(() => {
  stopScanner()
})
</script>

<template>
  <div class="search-container">
    <h1>Fixed Asset Checker</h1>
    <p>Arahkan kamera ke QR Code di bawah ini.</p>

    <div id="qr-reader"></div>

    <p class="separator">atau</p>

    <input
      v-model="scanInput"
      type="text"
      placeholder="Paste manual di sini..."
      class="search-input"
    />
  </div>
</template>

<style scoped>
.search-container {
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  text-align: center;
  font-family: Arial, sans-serif;
}

/* 11. Style untuk viewfinder scanner */
#qr-reader {
  width: 100%;
  max-width: 500px;
  margin: 10px auto;
  border: 2px solid #ccc;
  border-radius: 8px;
}

.separator {
  margin: 20px 0;
  font-weight: bold;
  color: #555;
}

.search-input {
  width: 95%;
  padding: 12px;
  font-size: 16px;
  border: 2px solid #ccc;
  border-radius: 8px;
}
</style>
