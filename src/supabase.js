// src/supabase.js (Versi Final untuk Vercel)

import { createClient } from '@supabase/supabase-js'

// Baca dari Environment Variables Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)