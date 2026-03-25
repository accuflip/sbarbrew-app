// ============================================================
// SBAR Brew â Supabase Client
// js/supabase-client.js
// AccuFlip RN Â· AccuFlip Digital Solutions LLC
//
// FIRST THING: Replace the two values below with your credentials
// Found in: Supabase Dashboard â Project Settings â API
// ============================================================

const SUPABASE_URL     = 'https://bdiwqmpgxepegefxgsyf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkaXdxbXBneGVwZWdlZnhnc3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDIzNzEsImV4cCI6MjA4OTk3ODM3MX0.FhoCHt4hX8OQtaPvd56yX5Ctq28m23XEms_0qF4dnVU'

const { createClient } = supabase
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// âââââââââââââââââââââââââââââââââââââââââ
// Auth helpers
// âââââââââââââââââââââââââââââââââââââââââ

async function getUser() {
  const { data: { user } } = await db.auth.getUser()
  return user
}

async function requireAuth(redirectTo = 'login.html') {
  const user = await getUser()
  if (!user) { window.location.href = redirectTo; return null }
  return user
}

// âââââââââââââââââââââââââââââââââââââââââ
// License check
// Returns license type or 'trial'
// âââââââââââââââââââââââââââââââââââââââââ

async function getLicense(userId) {
  if (!userId) return null
  const { data } = await db
    .from('licenses')
    .select('license_type, subject_ids, expires_at')
    .eq('user_id', userId)
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
  return data && data.length > 0 ? data[0] : null
}

async function hasSubjectAccess(userId, subjectId) {
  if (!userId) return false
  const { data } = await db
    .from('licenses')
    .select('license_type, subject_ids')
    .eq('user_id', userId)
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
  if (!data || data.length === 0) return false
  for (const lic of data) {
    if (lic.license_type === 'all_access') return true
    if (lic.subject_ids && lic.subject_ids.includes(subjectId)) return true
  }
  return false
}

// Auth state listener
db.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') sessionStorage.clear()
})
