const quotes = [
  "\"Don't waste your time, every second counts towards your future.\"",
  "\"Focus on being productive instead of busy.\"",
  "\"Your future is created by what you do today, not tomorrow.\"",
  "\"Deep work is superpower in a distracted world.\"",
  "\"Stay disciplined. Small progress every day adds up to big results.\"",
  "\"Eliminate distractions and conquer your goals.\""
];

// DOM Elements
const setupView = document.getElementById('setupView');
const countdownView = document.getElementById('countdownView');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const statusBadge = document.getElementById('statusBadge');
const quoteText = document.getElementById('quoteText');

const inpYears = document.getElementById('inpYears');
const inpMonths = document.getElementById('inpMonths');
const inpDays = document.getElementById('inpDays');
const inpHours = document.getElementById('inpHours');
const inpMinutes = document.getElementById('inpMinutes');
const inpSeconds = document.getElementById('inpSeconds');

const tYears = document.getElementById('tYears');
const tMonths = document.getElementById('tMonths');
const tDays = document.getElementById('tDays');
const tHours = document.getElementById('tHours');
const tMinutes = document.getElementById('tMinutes');
const tSeconds = document.getElementById('tSeconds');

const bgBoxes = document.getElementById('bgBoxes');

let timerInterval = null;
let backgroundBoxes = [];
let backgroundProgress = 0;

// Rotate quotes randomly on load
function loadRandomQuote() {
  const randIndex = Math.floor(Math.random() * quotes.length);
  quoteText.textContent = quotes[randIndex];
}

// Preset button handlers
document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    inpYears.value = 0;
    inpMonths.value = 0;
    inpDays.value = btn.dataset.days || 0;
    inpHours.value = 0;
    inpMinutes.value = btn.dataset.mins || 0;
    inpSeconds.value = 0;
  });
});

// Check existing countdown state from chrome.storage
document.addEventListener('DOMContentLoaded', () => {
  loadRandomQuote();
  chrome.storage.local.get(['targetTimestamp', 'totalDuration', 'isPaused', 'pausedRemaining'], (data) => {
    if (data.targetTimestamp && !data.isPaused) {
      startTimerEngine(data.targetTimestamp, data.totalDuration);
    } else if (data.isPaused && data.pausedRemaining) {
      showCountdownView();
      createBackgroundBoxes();
      updateBackgroundColors(data.pausedRemaining / data.totalDuration);
      renderTime(data.pausedRemaining);
      statusBadge.textContent = "Paused";
      pauseBtn.textContent = "Resume";
    }
  });
});

startBtn.addEventListener('click', () => {
  const y = parseInt(inpYears.value) || 0;
  const mo = parseInt(inpMonths.value) || 0;
  const d = parseInt(inpDays.value) || 0;
  const h = parseInt(inpHours.value) || 0;
  const m = parseInt(inpMinutes.value) || 0;
  const s = parseInt(inpSeconds.value) || 0;

  if (y === 0 && mo === 0 && d === 0 && h === 0 && m === 0 && s === 0) {
    alert("Please set a valid time greater than 0.");
    return;
  }

  const now = new Date().getTime();
  // Approximate month as 30 days & year as 365 days for countdown calculation
  const totalSeconds = (((y * 365 + mo * 30 + d) * 24 + h) * 60 + m) * 60 + s;
  const totalMs = totalSeconds * 1000;
  const targetTime = now + totalMs;

  chrome.storage.local.set({
    targetTimestamp: targetTime,
    totalDuration: totalMs,
    isPaused: false,
    pausedRemaining: null
  }, () => {
    startTimerEngine(targetTime, totalMs);
  });
});

function startTimerEngine(targetTime, totalDuration) {
  showCountdownView();
  statusBadge.textContent = "Running";
  pauseBtn.textContent = "Pause";
  createBackgroundBoxes();

  if (timerInterval) clearInterval(timerInterval);

  const updateTimer = () => {
    const now = new Date().getTime();
    const remaining = targetTime - now;

    if (remaining <= 0) {
      clearInterval(timerInterval);
      chrome.storage.local.clear();
      renderTime(0);
      statusBadge.textContent = "Finished!";
      updateBackgroundColors(0);
      alert("⏱️ Time's up! Great work session completed.");
      resetToSetup();
      return;
    }

    const progressRatio = remaining / totalDuration;
    updateBackgroundColors(progressRatio);
    renderTime(remaining);
  };

  updateTimer();
  if (targetTime > Date.now()) {
    timerInterval = setInterval(updateTimer, 1000);
  }
}

function createBackgroundBoxes() {
  const columns = Math.ceil(window.innerWidth / 72);
  const rows = Math.ceil(window.innerHeight / 72);
  const boxCount = columns * rows;
  bgBoxes.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
  bgBoxes.style.gridTemplateRows = `repeat(${rows}, minmax(0, 1fr))`;
  bgBoxes.replaceChildren();
  backgroundBoxes = Array.from({ length: boxCount }, () => {
    const box = document.createElement('div');
    box.className = 'bg-box';
    bgBoxes.appendChild(box);
    return box;
  });

}

// Fill the background grid in order as the countdown progresses.
function updateBackgroundColors(remainingRatio) {
  backgroundProgress = 1 - Math.max(0, Math.min(1, remainingRatio));
  const filledCount = Math.ceil(backgroundProgress * backgroundBoxes.length);
  const hue = 205 * (1 - backgroundProgress);
  bgBoxes.style.setProperty('--progress-color', `hsl(${hue}, 85%, 58%)`);

  backgroundBoxes.forEach((box, index) => {
    box.classList.toggle('is-filled', index < filledCount);
  });
}

window.addEventListener('resize', () => {
  if (backgroundBoxes.length) {
    createBackgroundBoxes();
    updateBackgroundColors(1 - backgroundProgress);
  }
});

function renderTime(ms) {
  let seconds = Math.floor(ms / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  let days = Math.floor(hours / 24);
  let months = Math.floor(days / 30);
  let years = Math.floor(days / 365);

  days %= 365;
  hours %= 24;
  minutes %= 60;
  seconds %= 60;

  tYears.textContent = String(years).padStart(2, '0');
  tMonths.textContent = String(months).padStart(2, '0');
  tDays.textContent = String(days).padStart(2, '0');
  tHours.textContent = String(hours).padStart(2, '0');
  tMinutes.textContent = String(minutes).padStart(2, '0');
  tSeconds.textContent = String(seconds).padStart(2, '0');
}

function showCountdownView() {
  setupView.style.display = 'none';
  countdownView.style.display = 'flex';
}

function resetToSetup() {
  if (timerInterval) clearInterval(timerInterval);
  chrome.storage.local.clear();
  setupView.style.display = 'flex';
  countdownView.style.display = 'none';
  statusBadge.textContent = "Ready";
  bgBoxes.replaceChildren();
  bgBoxes.style.removeProperty('grid-template-columns');
  bgBoxes.style.removeProperty('grid-template-rows');
  backgroundBoxes = [];
  backgroundProgress = 0;
  loadRandomQuote();
}

resetBtn.addEventListener('click', resetToSetup);

pauseBtn.addEventListener('click', () => {
  chrome.storage.local.get(['targetTimestamp', 'totalDuration', 'isPaused'], (data) => {
    if (!data.isPaused) {
      // Pause timer
      if (timerInterval) clearInterval(timerInterval);
      const remaining = data.targetTimestamp - new Date().getTime();
      chrome.storage.local.set({
        isPaused: true,
        pausedRemaining: remaining
      });
      statusBadge.textContent = "Paused";
      pauseBtn.textContent = "Resume";
    } else {
      // Resume timer
      const newTarget = new Date().getTime() + data.pausedRemaining;
      chrome.storage.local.set({
        targetTimestamp: newTarget,
        isPaused: false,
        pausedRemaining: null
      }, () => {
        startTimerEngine(newTarget, data.totalDuration);
      });
    }
  });
});