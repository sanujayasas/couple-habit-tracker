/* ============================================
   OUR HABIT TRACKER — script.js
   ============================================ */

console.log("Habit Tracker loaded ✦");

// ---- CONSTANTS ----
const EMOJIS = [
  '🏃','🧘','📚','💧','🍎','🏋️','🌿','💑',
  '🎨','🎵','🌅','🌙','💪','🧠','☕','🚴','🌸','⭐'
];

const CAT_ICONS = {
  wellness:    '🌿',
  fitness:     '💪',
  mindfulness: '🧘',
  learning:    '📚',
  connection:  '💑',
  finance:     '💰',
  creativity:  '🎨',
  other:       '✦'
};

const MILESTONES = {
  7:   '🏅 1 Week!',
  14:  '✨ 2 Weeks!',
  21:  '🔥 21 Days!',
  30:  '🌟 1 Month!',
  60:  '💎 2 Months!',
  100: '👑 100 Days!'
};

// ---- STATE ----
let habits = [];
let currentLogIndex = null;

// ============================================================
//  STORAGE  (window.storage persistent API)
// ============================================================
async function loadHabits() {
  try {
    const res = await window.storage.get('couple-habits');
    habits = res ? JSON.parse(res.value) : [];
  } catch {
    habits = [];
  }
}

async function saveHabits() {
  try {
    await window.storage.set('couple-habits', JSON.stringify(habits));
  } catch (e) {
    console.error('Save failed:', e);
  }
}

// ============================================================
//  EMOJI PICKER
// ============================================================
function buildEmojiPicker() {
  const picker = document.getElementById('emojiPicker');
  EMOJIS.forEach((emoji, i) => {
    const btn = document.createElement('button');
    btn.className = 'emoji-btn' + (i === 0 ? ' selected' : '');
    btn.textContent = emoji;
    btn.setAttribute('data-emoji', emoji);
    btn.setAttribute('type', 'button');
    btn.addEventListener('click', () => {
      document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
    picker.appendChild(btn);
  });
}

function getSelectedEmoji() {
  const sel = document.querySelector('.emoji-btn.selected');
  return sel ? sel.getAttribute('data-emoji') : '⭐';
}

// ============================================================
//  TOAST POPUP
// ============================================================
let popupTimer = null;

function showPopup(msg) {
  const el = document.getElementById('popup');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(popupTimer);
  popupTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

// ============================================================
//  CONFETTI BURST
// ============================================================
function burst(x, y) {
  const colors = ['#e8b4a0','#c97b63','#d4a853','#3d2c2c','#f5f0e8','#7a5c52'];
  for (let i = 0; i < 22; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const angle = (Math.random() - 0.5) * 200;
    const dist  = 40 + Math.random() * 80;
    piece.style.cssText = `
      left: ${x}px;
      top: ${y}px;
      background: ${colors[i % colors.length]};
      transform: translate(${angle}px, 0) rotate(${Math.random() * 360}deg);
      animation-duration: ${0.8 + Math.random() * 0.7}s;
    `;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 1600);
  }
}

// ============================================================
//  STATS
// ============================================================
function updateStats() {
  const today = new Date().toDateString();
  document.getElementById('statTotal').textContent = habits.length;
  document.getElementById('statCompleted').textContent =
    habits.filter(h => h.lastCompleted === today).length;
  const best = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
  document.getElementById('statBestStreak').textContent = best;
}

// ============================================================
//  RENDER
// ============================================================
function renderHabits() {
  const list   = document.getElementById('habitList');
  const header = document.getElementById('listHeader');
  list.innerHTML = '';

  if (habits.length === 0) {
    header.style.display = 'none';
    list.innerHTML = `
      <div class="empty-state">
        <div class="big-emoji">🌱</div>
        <p>No habits yet.<br>Add your first one above and start<br>growing together.</p>
      </div>`;
    updateStats();
    return;
  }

  header.style.display = 'flex';
  const today = new Date().toDateString();

  habits.forEach((habit, index) => {
    const doneToday  = habit.lastCompleted === today;
    const goalDays   = habit.goal || 30;
    const progress   = Math.min(100, Math.round((habit.streak / goalDays) * 100));
    const milestone  = MILESTONES[habit.streak] || null;
    const isHot      = habit.streak >= 7;
    const catIcon    = CAT_ICONS[habit.category] || '✦';
    const catLabel   = habit.category
      ? `<span class="habit-category">${catIcon} ${habit.category}</span>`
      : '';
    const milTag     = milestone
      ? `<span class="milestone-tag">🏆 ${milestone}</span>`
      : '';

    const li = document.createElement('li');
    li.className = 'habit-card' + (doneToday ? ' done-today' : '');
    li.style.animationDelay = (index * 0.06) + 's';

    li.innerHTML = `
      <div class="habit-top">
        <div class="habit-left">
          <div class="habit-emoji">${habit.emoji || '⭐'}</div>
          <div class="habit-info">
            <div class="habit-name">${habit.name}</div>
            <div class="habit-meta">
              ${catLabel}
              <span class="streak-badge ${isHot ? 'hot' : ''}">
                <span class="fire">${isHot ? '🔥' : '✦'}</span>
                ${habit.streak} day${habit.streak !== 1 ? 's' : ''}
              </span>
              ${milTag}
            </div>
          </div>
        </div>
      </div>

      <div class="goal-row">
        <div class="goal-label">
          <span>Progress to goal</span>
          <strong>${habit.streak} / ${goalDays} days</strong>
        </div>
        <div class="progress-track">
          <div class="progress-fill ${progress >= 100 ? 'complete' : ''}"
               style="width:${progress}%"></div>
        </div>
      </div>

      <div class="actions">
        <button
          class="btn-done ${doneToday ? 'already-done' : ''}"
          onclick="markDone(${index}, event)"
          ${doneToday ? 'disabled' : ''}>
          ${doneToday ? '✓ Done Today' : '✓ Mark Done'}
        </button>
        <button class="btn-log" onclick="openLogModal(${index})">📋 Log</button>
        <button class="btn-delete" onclick="deleteHabit(${index})">🗑</button>
      </div>
    `;

    list.appendChild(li);
  });

  updateStats();
}

// ============================================================
//  ADD HABIT
// ============================================================
async function addHabit() {
  const input = document.getElementById('habitInput');
  const name  = input.value.trim();

  if (!name) {
    showPopup('❌ Enter a habit name first!');
    input.focus();
    return;
  }

  const emoji     = getSelectedEmoji();
  const category  = document.getElementById('categorySelect').value;
  const goal      = parseInt(document.getElementById('goalInput').value) || 30;
  const frequency = document.getElementById('frequencySelect').value;

  habits.push({
    name,
    emoji,
    category,
    goal,
    frequency,
    streak: 0,
    lastCompleted: null,
    log: []
  });

  input.value = '';
  await saveHabits();
  renderHabits();
  showPopup('✅ Habit added! Let\'s crush it together!');
}

// ============================================================
//  MARK DONE
// ============================================================
async function markDone(index, e) {
  const today = new Date().toDateString();
  const habit = habits[index];

  if (habit.lastCompleted === today) {
    showPopup('✓ Already done today!');
    return;
  }

  const prevStreak = habit.streak;

  if (!habit.lastCompleted) {
    habit.streak = 1;
  } else {
    const last    = new Date(habit.lastCompleted);
    const now     = new Date(today);
    const diffMs  = now - last;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    habit.streak  = diffDays < 2 ? habit.streak + 1 : 1;
  }

  habit.lastCompleted = today;
  if (!habit.log) habit.log = [];
  habit.log.push({ date: today, note: '' });

  await saveHabits();
  renderHabits();

  // Confetti on milestone or streak increment
  const milestone = MILESTONES[habit.streak];
  if ((milestone || habit.streak > prevStreak) && e && e.clientX) {
    burst(e.clientX, e.clientY);
  }

  const msg = milestone
    ? `🏆 ${milestone} ${habit.streak}-day streak!`
    : `🎉 ${habit.streak}-day streak on "${habit.name}"!`;
  showPopup(msg);
}

// ============================================================
//  DELETE HABIT
// ============================================================
async function deleteHabit(index) {
  const name  = habits[index].name;
  const cards = document.querySelectorAll('.habit-card');

  if (cards[index]) {
    cards[index].style.animation = 'cardOut .3s ease forwards';
  }

  setTimeout(async () => {
    habits.splice(index, 1);
    await saveHabits();
    renderHabits();
    showPopup(`🗑 Removed: ${name}`);
  }, 280);
}

// ============================================================
//  LOG MODAL
// ============================================================
function openLogModal(index) {
  currentLogIndex = index;
  const habit = habits[index];

  document.getElementById('logModalTitle').textContent =
    (habit.emoji || '⭐') + ' ' + habit.name;
  document.getElementById('logModalSubtitle').textContent =
    `${habit.log ? habit.log.length : 0} entries · ${habit.streak} day streak`;

  renderLogEntries(habit);
  document.getElementById('logNoteInput').value = '';
  document.getElementById('logModalBackdrop').classList.add('open');
}

function renderLogEntries(habit) {
  const container = document.getElementById('logEntries');
  container.innerHTML = '';

  if (!habit.log || habit.log.length === 0) {
    container.innerHTML = `
      <div class="log-entry">
        <span class="log-entry-note">
          No entries yet. Mark the habit done to start logging!
        </span>
      </div>`;
    return;
  }

  [...habit.log].reverse().forEach(entry => {
    const div = document.createElement('div');
    div.className = 'log-entry';
    div.innerHTML = `
      <div class="log-entry-dot"></div>
      <span class="log-entry-date">${entry.date}</span>
      <span class="log-entry-note">${entry.note || '—'}</span>
    `;
    container.appendChild(div);
  });
}

async function saveNote() {
  if (currentLogIndex === null) return;
  const note  = document.getElementById('logNoteInput').value.trim();
  const habit = habits[currentLogIndex];
  const today = new Date().toDateString();

  if (!note) { showPopup('❌ Note is empty!'); return; }

  // Find today's log entry and update, or add a note-only entry
  const existing = habit.log ? habit.log.find(e => e.date === today) : null;
  if (existing) {
    existing.note = note;
  } else {
    if (!habit.log) habit.log = [];
    habit.log.push({ date: today, note });
  }

  await saveHabits();
  renderLogEntries(habit);
  document.getElementById('logNoteInput').value = '';
  showPopup('📝 Note saved!');
}

function closeLogModal() {
  document.getElementById('logModalBackdrop').classList.remove('open');
  currentLogIndex = null;
}

// Close on backdrop click
document.getElementById('logModalBackdrop').addEventListener('click', function (e) {
  if (e.target === this) closeLogModal();
});

// ============================================================
//  INIT
// ============================================================
(async () => {
  buildEmojiPicker();
  await loadHabits();
  renderHabits();
})();
