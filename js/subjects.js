// ============================================================
// SBAR Brew â Subjects + License Logic
// js/subjects.js
// ============================================================

async function loadSubjects() {
  const { data, error } = await db
    .from('subjects')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return data
}

async function loadCards(subjectId) {
  const { data, error } = await db
    .from('cards')
    .select('*')
    .eq('subject_id', subjectId)
    .eq('active', true)
    .order('card_order')
  if (error) throw error
  return data
}

async function loadProgress(userId, subjectId) {
  const cardIds = (await db
    .from('cards')
    .select('id')
    .eq('subject_id', subjectId)
    .eq('active', true)
  ).data?.map(c => c.id) || []

  if (cardIds.length === 0) return {}

  const { data } = await db
    .from('user_progress')
    .select('card_id, status, correct_streak, times_seen, times_correct')
    .eq('user_id', userId)
    .in('card_id', cardIds)

  const map = {}
  for (const row of (data || [])) map[row.card_id] = row
  return map
}

async function saveProgress(userId, cardId, status, wasCorrect) {
  const { data: existing } = await db
    .from('user_progress')
    .select('correct_streak, times_seen, times_correct')
    .eq('user_id', userId)
    .eq('card_id', cardId)
    .single()

  const prev = existing || { correct_streak: 0, times_seen: 0, times_correct: 0 }
  const streak = wasCorrect ? prev.correct_streak + 1 : 0
  const intervals = [0, 1, 3, 7, 14, 30]
  const days = intervals[Math.min(streak, intervals.length - 1)]
  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + days)

  await db.from('user_progress').upsert({
    user_id: userId,
    card_id: cardId,
    status,
    correct_streak: streak,
    times_seen: prev.times_seen + 1,
    times_correct: prev.times_correct + (wasCorrect ? 1 : 0),
    next_review_at: nextReview.toISOString(),
    last_seen_at: new Date().toISOString()
  }, { onConflict: 'user_id,card_id' })
}
