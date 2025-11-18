<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
// 1. Hapus Papa.parse, impor Supabase
import { supabase } from '../supabase' // Sesuaikan path jika perlu

const route = useRoute()
const router = useRouter()

const assetId = ref(route.params.id)
const asset = ref(null)
const loading = ref(true)
const error = ref(null)

const inputModel = ref('')
const inputRemarks = ref('not available')
const isModelPreFilled = ref(false)

const isSubmitting = ref(false)
const submitMessage = ref(null)

// ==================================================================
// FUNGSI onMounted (READ data dari Supabase)
// ==================================================================
onMounted(async () => { // <-- Jadikan async
  loading.value = true
  error.value = null

  try {
    // 2. Ini adalah pengganti Papa.parse (Query READ)
    const { data, error: fetchError } = await supabase
      .from('assets') // <-- Ubah 'assets' menjadi 'assetchecker'
      .select('*') 
      .eq('"ASSET NO"', assetId.value) 
      .single()

    if (fetchError) {
      // Jika tidak ditemukan atau ada error
      asset.value = null
      error.value = `Aset dengan nomor ${assetId.value} tidak ditemukan.`
      console.error('Error fetching data:', fetchError.message)
    } else if (data) {
      // Jika data DITEMUKAN
      asset.value = data // Simpan data aset
      
      // Logika Anda sebelumnya, SAMA PERSIS karena nama kolomnya sama
      inputModel.value = data['MODEL'] || ''
      isModelPreFilled.value = !!data['MODEL']
      
      const currentRemarks = (data['REMARKS'] || '').toString().trim().toLowerCase()
      if (currentRemarks === 'available') {
        inputRemarks.value = 'available'
      } else {
        inputRemarks.value = 'not available'
      }
    }
    
  } catch (err) {
    error.value = 'Terjadi error saat mengambil data: ' + err.message
  } finally {
    loading.value = false
  }
})

// ==================================================================
// FUNGSI SUBMITDATA (UPDATE data ke Supabase)
// ==================================================================
// ==================================================================
// FUNGSI SUBMITDATA (POST) - (DENGAN POPUP SUKSES/GAGAL)
// ==================================================================
async function submitData() {
  if (!inputModel.value.trim()) {
    submitMessage.value = {
      type: 'error',
      text: 'Data Model wajib diisi.',
    }
    return
  }

  isSubmitting.value = true
  submitMessage.value = null

  try {
    const { data, error: updateError } = await supabase
      .from('assets')
      .update({
        'MODEL': inputModel.value,
        'REMARKS': inputRemarks.value,
      })
      .eq('"ASSET NO"', assetId.value)
      .select() // Tambahkan .select() agar Supabase mengembalikan data yang di-update

    if (updateError) {
      // Jika GAGAL, lempar error ke 'catch'
      throw updateError
    }

    // --- JIKA SUKSES ---
    isSubmitting.value = false
    
    // 1. Tampilkan pesan sukses
    submitMessage.value = {
      type: 'success',
      text: 'Data berhasil disimpan!',
    }

    // 2. Update state lokal agar UI-nya "terkunci"
    // Ini akan mengubah input Model menjadi teks (jika sebelumnya kosong)
    isModelPreFilled.value = true
    
    // 3. Update data aset lokal agar sesuai
    asset.value['MODEL'] = inputModel.value
    asset.value['REMARKS'] = inputRemarks.value

    // 4. JANGAN KEMBALI DULU. Biarkan user lihat pesan sukses.

  } catch (err) {
    // --- JIKA GAGAL ---
    isSubmitting.value = false
    submitMessage.value = {
      type: 'error',
      text: 'Gagal menyimpan data: ' + err.message,
    }
  }
}
// ==================================================================
// FUNGSI Toggle Remarks (TIDAK BERUBAH)
// ==================================================================
function toggleRemarks() {
  if (inputRemarks.value === 'available') {
    inputRemarks.value = 'not available'
  } else {
    inputRemarks.value = 'available'
  }
}

// ==================================================================
// FUNGSI Go Back (TIDAK BERUBAH)
// ==================================================================
function confirmAndGoBack() {
  router.push('/')
}
</script>

<template>
  <div class="detail-container">
    <button @click="confirmAndGoBack" class="back-button">&laquo; Kembali ke Scan</button>

    <div v-if="loading" class="status-box">
      <h2>Mencari data aset...</h2>
    </div>

    <div v-else-if="asset" class="asset-wrapper">
      <h1>Detail Aset</h1>
      <div class="info-item">
        <strong>ASSET NO:</strong>
        <span>{{ asset['ASSET NO'] }}</span>
      </div>
      <div class="info-item">
        <strong>ASSET NAME (Deskripsi):</strong>
        <span>{{ asset['ASSET NAME'] }}</span>
      </div>
      <div class="info-item">
        <strong>PART NO:</strong>
        <span>{{ asset['PART NO'] || '-' }}</span>
      </div>
      <div class="info-item">
        <strong>PART NAME:</strong>
        <span>{{ asset['PART NAME'] || '-' }}</span>
      </div>
      <div class="info-item">
        <strong>ACQ. DATE:</strong>
        <span>{{ asset['ACQ. DATE'] || '-' }}</span>
      </div>
      <form @submit.prevent="submitData" class="data-form">
        <div v-if="isModelPreFilled" class="info-item">
          <strong>MODEL:</strong>
          <span>{{ inputModel }}</span>
        </div>
        <div v-else class="form-group">
          <label for="model">MODEL:</label>
          <input
            id="model"
            v-model="inputModel"
            type="text"
            placeholder="Masukkan model (WAJIB DIISI)"
          />
        </div>

        <div class="form-group">
          <label>REMARKS:</label>
          <div class="remarks-toggle-wrapper">
            <button
              type="button"
              @click="toggleRemarks"
              :class="[
                'remarks-toggle-button',
                inputRemarks === 'available' ? 'is-available' : 'is-not-available',
              ]"
              :disabled="isSubmitting || submitMessage" 
              >
              STATUS: {{ inputRemarks.toUpperCase() }}
            </button>
          </div>
        </div>

        <div class="button-group" v-if="!submitMessage">
          <button type="submit" class="submit-button" :disabled="isSubmitting">
            {{ isSubmitting ? 'Menyimpan...' : 'Submit Data' }}
          </button>
        </div>

        <div v-if="submitMessage" :class="['submit-status', submitMessage.type]">
          <p>{{ submitMessage.text }}</p>
          
          <button 
            @click="confirmAndGoBack" 
            type="button" 
            class="back-from-status-button"
          >
            OK, Kembali ke Scan
          </button>
        </div>
        </form>

      <div v-if="submitMessage" :class="['submit-status', submitMessage.type]">
        {{ submitMessage.text }}
      </div>
    </div>
    <div v-else-if="error" class="status-box error">
      <h1>Terjadi Kesalahan</h1>
      <p>{{ error }}</p>
    </div>

    <div v-else class="status-box error">
      <h1>Aset Tidak Ditemukan</h1>
      <p>
        Aset dengan nomor <strong>{{ assetId }}</strong> tidak dapat ditemukan.
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Salin semua CSS Anda sebelumnya ke sini, tidak ada yang berubah */
.detail-container {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  font-family: Arial, sans-serif;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background-color: #fafafa;
}
.asset-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.asset-wrapper h1 {
  color: #333;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
  margin-top: 0;
}
.info-item {
  display: flex;
  flex-direction: column;
  padding: 8px;
  border-bottom: 1px solid #eee;
}
.info-item strong {
  font-size: 14px;
  color: #555;
  margin-bottom: 4px;
  text-transform: uppercase;
}
.info-item span {
  font-size: 18px;
  color: #000;
}
.form-group {
  padding: 8px;
  margin-bottom: 10px;
}
.form-group label {
  display: block;
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 14px;
  color: #555;
  text-transform: uppercase;
}
.form-group input {
  width: 95%;
  padding: 12px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 5px;
}
.separator {
  border: none;
  border-top: 2px solid #eee;
  margin: 15px 0;
}
.back-button {
  margin-bottom: 25px;
  padding: 8px 15px;
  font-size: 14px;
  cursor: pointer;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 5px;
}
.status-box {
  text-align: center;
  padding: 40px;
}
.error {
  color: #d8000c;
  background-color: #ffd2d2;
  border: 1px solid #d8000c;
  border-radius: 8px;
}
.remarks-toggle-button {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  font-weight: bold;
  text-transform: uppercase;
  border: 2px solid;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}
.remarks-toggle-button.is-not-available {
  background-color: #f8d7da;
  color: #721c24;
  border-color: #dc3545;
}
.remarks-toggle-button.is-available {
  background-color: #d4edda;
  color: #155724;
  border-color: #28a745;
}
.button-group {
  margin-top: 10px;
  padding: 8px;
  display: flex;
}
.submit-button {
  flex-grow: 1;
  font-size: 18px;
  font-weight: bold;
  padding: 14px 10px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background-color: #28a745;
  color: white;
}
.submit-button:disabled {
  background-color: #aaa;
}
/* ... (SEMUA CSS ANDA YANG SUDAH ADA) ... */


/* Style untuk status message (diperbarui) */
.submit-status {
  margin-top: 15px;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid;
}
.submit-status p {
  margin: 0 0 10px 0; /* Jarak untuk teks di atas tombol */
  font-size: 16px;
  font-weight: bold;
}

/* Style untuk pesan Error (sudah ada, tapi ini perbaikan) */
.submit-status.error {
  background-color: #f8d7da;
  color: #721c24;
  border-color: #f5c6cb;
}

/* Style BARU untuk pesan Sukses */
.submit-status.success {
  background-color: #d4edda;
  color: #155724;
  border-color: #c3e6cb;
}

/* Style BARU untuk tombol 'OK, Kembali ke Scan' */
.back-from-status-button {
  background-color: #007bff; /* Biru */
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
}
.back-from-status-button:hover {
  background-color: #0056b3;
}

/* Tambahan: Buat tombol remarks non-aktif setelah submit */
.remarks-toggle-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>