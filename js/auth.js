// ============================================================
// SBAR Brew â Auth
// js/auth.js
// ============================================================

async function signUp(email, password) {
  const { data, error } = await db.auth.signUp({ email, password })
  if (error) throw error
  return data
}

async function signIn(email, password) {
  const { data, error } = await db.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

async function signOut() {
  await db.auth.signOut()
  window.location.href = 'index.html'
}

async function resetPassword(email) {
  const { error } = await db.auth.resetPasswordForEmail(email, {
    redirectTo: "https://sbarbrew.com/reset.html"
  })
  if (error) throw error
}

function showError(msg) {
  const el = document.getElementById('auth-error')
  if (el) { el.textContent = msg; el.style.display = 'block' }
}

function clearError() {
  const el = document.getElementById('auth-error')
  if (el) el.style.display = 'none'
}

function setLoading(loading) {
  const btn = document.getElementById('auth-submit')
  if (btn) {
    btn.disabled = loading
    btn.textContent = loading ? 'Please wait...' : btn.dataset.label
  }
}

async function handleAuth(mode, email, password) {
  clearError()
  setLoading(true)
  try {
    if (mode === 'signup') {
      await signUp(email, password)
    } else {
      await signIn(email, password)
    }
    window.location.href = 'dashboard.html'
  } catch (err) {
    let msg = 'Something went wrong â please try again.'
    if (err.message?.includes('Invalid login')) msg = 'Incorrect email or password.'
    if (err.message?.includes('already registered')) msg = 'An account with this email already exists.'
    if (err.message?.includes('Password')) msg = 'Password must be at least 6 characters.'
    showError(msg)
  } finally {
    setLoading(false)
  }
}
