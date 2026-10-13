import { createClient } from '@supabase/supabase-js'

// These values are safe for the browser. Never put a service_role key here.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rqtauosvfxhxkwvgneun.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_mbYZ5fUKi0V2RseIADczfA_prvOqtoO'

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null

export async function loadLearningProgress(userId) {
  if (!supabase) return null
  const { data, error } = await supabase.from('learning_progress').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function saveLearningProgress(userId, progress) {
  if (!supabase) return
  const { error } = await supabase.from('learning_progress').upsert({ user_id: userId, ...progress, updated_at: new Date().toISOString() })
  if (error) throw error
}
