// ============================================================
// SBAR Brew â Card Engine
// js/cards.js
// Mobile-first: swipe gestures, landscape mode, randomization
// ============================================================

let S = {
  cards: [],
  shuffled: [],
  idx: 0,
  mode: 'flip',
  flipped: false,
  randomized: false,
  score: { c: 0, t: 0 },
  userId: null,
  subjectId: null,
  hasAccess: false,
  quizAnswered: false,
  touchStartX: 0,
  touchStartY: 0,
  touchStartTime: 0
}

// âââââââââââââââââââââââââââââââââââââââââ
// Init
// âââââââââââââââââââââââââââââââââââââââââ

async function initStudy(subjectId, userId, hasAccess) {
  S.subjectId = subjectId
  S.userId = userId
  S.hasAccess = hasAccess
  S.idx = 0
  S.score = { c: 0, t: 0 }
  S.randomized = false

  S.cards = await loadCards(subjectId)
  S.shuffled = [...S.cards]

  if (!S.cards.length) {
    document.getElementById('main-content').innerHTML =
      '<p style="text-align:center;padding:2rem;color:var(--muted);">No cards found for this subject.</p>'
    return
  }

  setupSwipe()
  setupKeyboard()
  setupOrientationHandler()
  renderCard()
}

// âââââââââââââââââââââââââââââââââââââââââ
// Randomization
// âââââââââââââââââââââââââââââââââââââââââ

function toggleRandomize() {
  S.randomized = !S.randomized
  S.idx = 0
  S.flipped = false

  if (S.randomized) {
    // Fisher-Yates shuffle
    S.shuffled = [...S.cards]
    for (let i = S.shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[S.shuffled[i], S.shuffled[j]] = [S.shuffled[j], S.shuffled[i]]
    }
  } else {
    S.shuffled = [...S.cards]
  }

  const btn = document.getElementById('randomize-btn')
  if (btn) {
    btn.textContent = S.randomized ? 'In order' : 'Randomize'
    btn.style.borderColor = S.randomized ? 'var(--caramel)' : ''
    btn.style.color = S.randomized ? 'var(--caramel)' : ''
  }

  renderCard()
}

function currentCard() {
  return S.shuffled[S.idx]
}

// âââââââââââââââââââââââââââââââââââââââââ
// Render
// âââââââââââââââââââââââââââââââââââââââââ

function renderCard() {
  const card = currentCard()
  if (!card) return

  S.flipped = false
  document.getElementById('card-inner')?.classList.remove('flipped')

  const total = S.shuffled.length
  const cur = S.idx + 1

  setEl('card-counter', `${cur} of ${total}`)
  const prog = document.getElementById('prog')
  if (prog) prog.style.width = `${Math.round((cur / total) * 100)}%`

  const prev = document.getElementById('prev-btn')
  const next = document.getElementById('next-btn')
  if (prev) prev.disabled = S.idx === 0
  if (next) next.disabled = S.idx >= total - 1

  // Front of card
  setEl('front-title', card.title)
  setEl('front-subtitle', card.subtitle || '')

  // Effects (pharmacology) or type badge (terminology)
  const effList = document.getElementById('effects-list')
  if (effList) {
    const effects = Array.isArray(card.effects)
      ? card.effects
      : JSON.parse(card.effects || '[]')

    if (effects && effects.length > 0) {
      effList.innerHTML = effects.map(e => `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;
          background:${e.dir === 'up' ? '#D1FAE520' : '#FEE2E220'};
          border:0.5px solid ${e.dir === 'up' ? '#6EE7B7' : '#FCA5A5'};margin-bottom:6px;">
          <span style="font-size:18px;font-weight:500;width:20px;text-align:center;
            color:${e.dir === 'up' ? '#6EE7B7' : '#FCA5A5'}">${e.dir === 'up' ? 'â' : 'â'}</span>
          <span style="font-size:14px;color:#F5EDD6;">${e.text}</span>
        </div>`).join('')
    } else if (card.card_type === 'terminology') {
      effList.innerHTML = `
        <div style="display:inline-block;padding:4px 12px;border-radius:20px;
          background:#2A1200;border:1px solid #C47B2B;font-size:12px;
          color:#C47B2B;font-weight:500;margin-bottom:8px;">${card.subtitle || 'Term'}</div>`
    } else {
      effList.innerHTML = ''
    }
  }

  // Back of card â adapts to card type
  if (card.card_type === 'terminology') {
    setEl('b-does', card.definition || '')
    setEl('b-why', card.example || '')
    setEl('b-watch', card.memory_tip || '')
    setEl('b-hold', '')
    setEl('b-teach', '')

    // Relabel back cells for terminology
    const labels = document.querySelectorAll('.cell-label')
    if (labels[0]) labels[0].textContent = 'Meaning'
    if (labels[1]) labels[1].textContent = 'Example'
    if (labels[2]) labels[2].textContent = 'Memory tip'
    if (labels[3]) labels[3].textContent = ''
    if (labels[4]) labels[4].textContent = ''

    // Hide unused cells
    const cells = document.querySelectorAll('.back-cell')
    if (cells[3]) cells[3].style.display = 'none'
    if (cells[4]) cells[4].style.display = 'none'
  } else {
    // Pharmacology labels
    const labels = document.querySelectorAll('.cell-label')
    if (labels[0]) labels[0].textContent = 'What it does'
    if (labels[1]) labels[1].textContent = 'Why given'
    if (labels[2]) labels[2].textContent = 'Watch for'
    if (labels[3]) labels[3].textContent = 'Hold / act if'
    if (labels[4]) labels[4].textContent = 'Teach the patient'

    const cells = document.querySelectorAll('.back-cell')
    if (cells[3]) cells[3].style.display = ''
    if (cells[4]) cells[4].style.display = ''

    setEl('b-does', card.does || '')
    setEl('b-why', card.why || '')
    setEl('b-watch', card.watch || '')
    setEl('b-hold', card.hold_act || '')
    setEl('b-teach', card.teach || '')
  }

  const bbw = document.getElementById('b-bbw')
  if (bbw) {
    bbw.innerHTML = card.black_box_warning
      ? '<span style="background:#3D0A0A;color:#FCA5A5;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:500;">Black box warning</span>'
      : ''
  }

  if (S.mode === 'quiz') renderQuiz(card)
}

// âââââââââââââââââââââââââââââââââââââââââ
// Flip
// âââââââââââââââââââââââââââââââââââââââââ

function flipCard() {
  if (S.mode !== 'flip') return
  S.flipped = !S.flipped
  document.getElementById('card-inner')?.classList.toggle('flipped', S.flipped)
}

// âââââââââââââââââââââââââââââââââââââââââ
// Navigate
// âââââââââââââââââââââââââââââââââââââââââ

function navigate(dir) {
  const next = S.idx + dir
  if (!S.hasAccess && next >= 3) { showUpgrade(); return }
  if (next < 0 || next >= S.shuffled.length) return
  S.idx = next
  S.flipped = false
  S.quizAnswered = false
  renderCard()
}

function markCard(knew) {
  const card = currentCard()
  if (card && S.userId) {
    saveProgress(S.userId, card.id, knew ? 'known' : 'learning', knew)
  }
  navigate(1)
}

// âââââââââââââââââââââââââââââââââââââââââ
// Swipe gestures (mobile)
// âââââââââââââââââââââââââââââââââââââââââ

function setupSwipe() {
  const el = document.getElementById('card-wrap')
  if (!el) return

  el.addEventListener('touchstart', e => {
    S.touchStartX = e.touches[0].clientX
    S.touchStartY = e.touches[0].clientY
    S.touchStartTime = Date.now()
  }, { passive: true })

  el.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - S.touchStartX
    const dy = e.changedTouches[0].clientY - S.touchStartY
    const dt = Date.now() - S.touchStartTime
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    // Swipe threshold: fast enough, horizontal enough
    if (dt < 500 && absDx > 50 && absDx > absDy * 1.5) {
      if (dx < 0) {
        // Swipe left = next card
        navigate(1)
      } else {
        // Swipe right = previous card
        navigate(-1)
      }
    } else if (dt < 300 && absDx < 15 && absDy < 15) {
      // Tap (no movement) = flip
      flipCard()
    }
  }, { passive: true })
}

// âââââââââââââââââââââââââââââââââââââââââ
// Keyboard navigation
// âââââââââââââââââââââââââââââââââââââââââ

function setupKeyboard() {
  document.addEventListener('keydown', e => {
    switch(e.key) {
      case 'ArrowRight': case 'ArrowDown': navigate(1); break
      case 'ArrowLeft': case 'ArrowUp': navigate(-1); break
      case ' ': case 'Enter': flipCard(); break
      case 'k': case 'K': markCard(true); break
      case 'l': case 'L': markCard(false); break
    }
  })
}

// âââââââââââââââââââââââââââââââââââââââââ
// Orientation handler (landscape)
// âââââââââââââââââââââââââââââââââââââââââ

function setupOrientationHandler() {
  const updateOrientation = () => {
    const isLandscape = window.innerWidth > window.innerHeight
    const cardWrap = document.getElementById('card-wrap')
    const main = document.getElementById('main-content')

    if (isLandscape && window.innerWidth < 900) {
      // Mobile landscape â larger card, hide some chrome
      if (cardWrap) cardWrap.style.height = '260px'
      if (main) main.style.padding = '0.75rem'
      document.getElementById('mode-tabs')?.style.setProperty('margin-bottom', '0.75rem')
    } else {
      // Portrait or desktop
      if (cardWrap) cardWrap.style.height = ''
      if (main) main.style.padding = ''
    }
  }

  window.addEventListener('resize', updateOrientation)
  window.addEventListener('orientationchange', () => {
    setTimeout(updateOrientation, 100)
  })
  updateOrientation()
}

// âââââââââââââââââââââââââââââââââââââââââ
// Quiz mode
// âââââââââââââââââââââââââââââââââââââââââ

function renderQuiz(card) {
  S.quizAnswered = false
  const isTerminology = card.card_type === 'terminology'

  const drugEl = document.getElementById('q-drug')
  const qEl = document.getElementById('q-question')
  const fb = document.getElementById('q-feedback')

  if (drugEl) drugEl.textContent = card.title + (card.subtitle ? ` â ${card.subtitle}` : '')
  if (qEl) qEl.textContent = isTerminology
    ? `What does "${card.title}" mean?`
    : `What does ${card.title} primarily do to the body?`
  if (fb) fb.style.display = 'none'

  const correct = isTerminology ? (card.definition || '') : (card.does || '')
  const distField = isTerminology ? 'definition' : 'does'

  const distractors = S.shuffled
    .filter(c => c.id !== card.id && c[distField])
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(c => c[distField])

  const opts = [correct, ...distractors].sort(() => Math.random() - 0.5)
  const container = document.getElementById('q-opts')
  if (!container) return

  container.innerHTML = opts.map((o, i) => `
    <button class="quiz-opt" id="qopt-${i}" onclick="checkAnswer(this, ${JSON.stringify(o === correct)}, ${JSON.stringify(card.teach || card.memory_tip || '')})">
      ${o}
    </button>`).join('')
}

function checkAnswer(btn, isCorrect, hint) {
  if (S.quizAnswered) return
  S.quizAnswered = true
  S.score.t++
  if (isCorrect) S.score.c++

  document.querySelectorAll('.quiz-opt').forEach(b => {
    b.disabled = true
  })

  if (isCorrect) {
    btn.classList.add('correct')
  } else {
    btn.classList.add('wrong')
    // Show correct answer
    document.querySelectorAll('.quiz-opt').forEach(b => {
      if (!b.classList.contains('wrong')) b.classList.add('correct')
    })
  }

  const fb = document.getElementById('q-feedback')
  if (fb) {
    fb.style.display = 'block'
    fb.style.background = isCorrect ? '#064E3B' : '#450A0A'
    fb.style.color = isCorrect ? '#6EE7B7' : '#FCA5A5'
    fb.style.padding = '10px 14px'
    fb.style.borderRadius = '8px'
    fb.style.fontSize = '13px'
    fb.style.marginTop = '12px'
    fb.textContent = isCorrect
      ? 'Correct!'
      : `Remember: ${hint || 'Review this card again.'}`
  }

  const chip = document.getElementById('score-chip')
  if (chip) chip.textContent = `${S.score.c} / ${S.score.t} correct`

  const card = currentCard()
  if (card && S.userId) saveProgress(S.userId, card.id, 'learning', isCorrect)

  setTimeout(() => {
    S.quizAnswered = false
    navigate(1)
  }, 1800)
}

// âââââââââââââââââââââââââââââââââââââââââ
// Mode switch
// âââââââââââââââââââââââââââââââââââââââââ

function setMode(mode) {
  S.mode = mode
  S.flipped = false
  S.quizAnswered = false

  document.querySelectorAll('.mode-tab').forEach((t, i) => {
    t.classList.toggle('active',
      (i === 0 && mode === 'flip') || (i === 1 && mode === 'quiz'))
  })

  const fm = document.getElementById('flip-mode')
  const qm = document.getElementById('quiz-mode')
  if (fm) fm.style.display = mode === 'flip' ? 'block' : 'none'
  if (qm) qm.style.display = mode === 'quiz' ? 'block' : 'none'

  renderCard()
}

// âââââââââââââââââââââââââââââââââââââââââ
// Upgrade prompt
// âââââââââââââââââââââââââââââââââââââââââ

function showUpgrade() {
  const el = document.getElementById('upgrade-overlay')
  if (el) el.style.display = 'flex'
}

function hideUpgrade() {
  const el = document.getElementById('upgrade-overlay')
  if (el) el.style.display = 'none'
}

// âââââââââââââââââââââââââââââââââââââââââ
// Helpers
// âââââââââââââââââââââââââââââââââââââââââ

function setEl(id, text) {
  const el = document.getElementById(id)
  if (el) el.textContent = text || ''
}
