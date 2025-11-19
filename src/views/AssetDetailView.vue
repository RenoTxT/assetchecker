<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../supabase'

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

// --- STATE BARU UNTUK POPUP ---
const showPopup = ref(false)
const popupType = ref('success') // 'success' atau 'error'
const popupMessage = ref('') // Untuk detail error jika perlu
// ------------------------------

// ==================================================================
// FUNGSI onMounted (READ)
// ==================================================================
onMounted(async () => {
  loading.value = true
  error.value = null

  try {
    const { data, error: fetchError } = await supabase
      .from('assets')
      .select('*')
      .eq('"ASSET NO"', assetId.value)
      .single()

    if (fetchError) {
      asset.value = null
      error.value = `Aset dengan nomor ${assetId.value} tidak ditemukan.`
    } else if (data) {
      asset.value = data
      
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
// FUNGSI SUBMITDATA (DENGAN POPUP ANIMASI)
// ==================================================================
async function submitData() {
  if (!inputModel.value.trim()) {
    triggerPopup('error', 'Data Model wajib diisi.')
    return
  }

  isSubmitting.value = true
  
  try {
    const { data, error: updateError } = await supabase
      .from('assets')
      .update({
        'MODEL': inputModel.value,
        'REMARKS': inputRemarks.value,
      })
      .eq('"ASSET NO"', assetId.value)
      .select()

    if (updateError) throw updateError

    // --- SUKSES ---
    isSubmitting.value = false
    isModelPreFilled.value = true
    
    // Tampilkan Popup Sukses
    triggerPopup('success')

    // Tunggu 3 detik, lalu kembali ke halaman scan
    setTimeout(() => {
      confirmAndGoBack()
    }, 3000)

  } catch (err) {
    // --- GAGAL ---
    isSubmitting.value = false
    // Tampilkan Popup Error
    triggerPopup('error', err.message)
  }
}

// Helper untuk memunculkan popup dan auto-close (jika error)
function triggerPopup(type, message = '') {
  popupType.value = type
  popupMessage.value = message
  showPopup.value = true

  // Jika error, tutup popup otomatis setelah 3 detik agar user bisa edit lagi
  // Jika success, kita biarkan tetap muncul sampai pindah halaman (diatur di submitData)
  if (type === 'error') {
    setTimeout(() => {
      showPopup.value = false
    }, 3000)
  }
}

function toggleRemarks() {
  if (inputRemarks.value === 'available') {
    inputRemarks.value = 'not available'
  } else {
    inputRemarks.value = 'available'
  }
}

function confirmAndGoBack() {
  router.push('/')
}
</script>

<template>
  <div class="detail-container">
    <button @click="confirmAndGoBack" class="back-button" :disabled="showPopup">&laquo; Kembali ke Scan</button>

    <div v-if="loading" class="status-box">
      <h2>Mencari data aset...</h2>
    </div>

    <div v-else-if="asset" class="asset-wrapper">
      <h1>Detail Aset</h1>
      <div class="info-item">
        <strong>ASSET NO:</strong><span>{{ asset['ASSET NO'] }}</span>
      </div>
      <div class="info-item">
        <strong>ASSET NAME:</strong><span>{{ asset['ASSET NAME'] }}</span>
      </div>
      <div class="info-item">
        <strong>PART NO:</strong><span>{{ asset['PART NO'] || '-' }}</span>
      </div>
      <div class="info-item">
        <strong>PART NAME:</strong><span>{{ asset['PART NAME'] || '-' }}</span>
      </div>
      <div class="info-item">
        <strong>ACQ. DATE:</strong><span>{{ asset['ACQ. DATE'] || '-' }}</span>
      </div>

      <form @submit.prevent="submitData" class="data-form">
        <div v-if="isModelPreFilled" class="info-item">
          <strong>MODEL:</strong><span>{{ inputModel }}</span>
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
              :class="['remarks-toggle-button', inputRemarks === 'available' ? 'is-available' : 'is-not-available']"
              :disabled="isSubmitting || showPopup"
            >
              STATUS: {{ inputRemarks.toUpperCase() }}
            </button>
          </div>
        </div>

        <div class="button-group">
          <button type="submit" class="submit-button" :disabled="isSubmitting || showPopup">
            {{ isSubmitting ? 'Menyimpan...' : 'Submit Data' }}
          </button>
        </div>
      </form>
    </div>

    <div v-else-if="error" class="status-box error">
      <h1>Terjadi Kesalahan</h1>
      <p>{{ error }}</p>
    </div>

    <div v-else class="status-box error">
      <h1>Aset Tidak Ditemukan</h1>
      <p>Aset dengan nomor <strong>{{ assetId }}</strong> tidak dapat ditemukan.</p>
    </div>

    <div v-if="showPopup" class="popup-overlay">
      <div class="popup-content">
        
        <div v-if="popupType === 'success'" class="icon-container success">
          <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
            <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
          <h2>SUCCESS</h2>
        </div>

        <div v-if="popupType === 'error'" class="icon-container error-anim">
           <svg class="cross" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
             <circle class="cross__circle" cx="26" cy="26" r="25" fill="none"/>
             <path class="cross__path" fill="none" d="M16 16 36 36 M36 16 16 36"/>
           </svg>
           <h2>FAILED</h2>
           <p class="error-text">{{ popupMessage }}</p>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
/* Container Styles (Sama seperti sebelumnya) */
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
.asset-wrapper { display: flex; flex-direction: column; gap: 10px; }
.asset-wrapper h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 0; }
.info-item { display: flex; flex-direction: column; padding: 8px; border-bottom: 1px solid #eee; }
.info-item strong { font-size: 14px; color: #555; margin-bottom: 4px; text-transform: uppercase; }
.info-item span { font-size: 18px; color: #000; }
.form-group { padding: 8px; margin-bottom: 10px; }
.form-group label { display: block; font-weight: bold; margin-bottom: 8px; font-size: 14px; color: #555; text-transform: uppercase; }
.form-group input { width: 95%; padding: 12px; font-size: 16px; border: 1px solid #ccc; border-radius: 5px; }
.back-button { margin-bottom: 25px; padding: 8px 15px; font-size: 14px; cursor: pointer; background-color: #f0f0f0; border: 1px solid #ccc; border-radius: 5px; }
.status-box { text-align: center; padding: 40px; }
.error { color: #d8000c; background-color: #ffd2d2; border: 1px solid #d8000c; border-radius: 8px; }

/* Buttons */
.remarks-toggle-button {
  width: 100%; padding: 12px; font-size: 16px; font-weight: bold; text-transform: uppercase;
  border: 2px solid; border-radius: 5px; cursor: pointer; transition: all 0.2s;
}
.remarks-toggle-button.is-not-available { background-color: #f8d7da; color: #721c24; border-color: #dc3545; }
.remarks-toggle-button.is-available { background-color: #d4edda; color: #155724; border-color: #28a745; }
.button-group { margin-top: 10px; padding: 8px; display: flex; }
.submit-button {
  flex-grow: 1; font-size: 18px; font-weight: bold; padding: 14px 10px;
  border: none; border-radius: 8px; cursor: pointer; background-color: #28a745; color: white;
}
.submit-button:disabled { background-color: #aaa; }

/* ========================================= */
/* POPUP / MODAL STYLES                      */
/* ========================================= */
.popup-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.6); /* Latar belakang gelap transparan */
  display: flex; justify-content: center; align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s;
}

.popup-content {
  background: white; padding: 30px; border-radius: 15px;
  text-align: center; width: 300px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  animation: scaleUp 0.3s;
}

.icon-container h2 { margin-top: 20px; font-size: 24px; font-weight: bold; }
.icon-container.success h2 { color: #4bb71b; }
.icon-container.error-anim h2 { color: #d8000c; }
.error-text { font-size: 12px; color: #555; margin-top: 5px; }

/* SVG ANIMATIONS */
/* Wrapper icons */
.checkmark, .cross { width: 80px; height: 80px; border-radius: 50%; display: block; stroke-width: 3; stroke-miterlimit: 10; margin: 0 auto; box-shadow: inset 0px 0px 0px #fff; animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both; }

/* Success Color */
.checkmark__circle { stroke-dasharray: 166; stroke-dashoffset: 166; stroke-width: 2; stroke-miterlimit: 10; stroke: #4bb71b; fill: none; animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards; }
.checkmark__check { transform-origin: 50% 50%; stroke-dasharray: 48; stroke-dashoffset: 48; stroke: #4bb71b; animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards; }

/* Error Color */
.cross__circle { stroke-dasharray: 166; stroke-dashoffset: 166; stroke-width: 2; stroke-miterlimit: 10; stroke: #d8000c; fill: none; animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards; }
.cross__path { transform-origin: 50% 50%; stroke-dasharray: 48; stroke-dashoffset: 48; stroke: #d8000c; animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards; }

/* Keyframes */
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes scaleUp { from { transform: scale(0.8); } to { transform: scale(1); } }
@keyframes stroke { 100% { stroke-dashoffset: 0; } }
</style>