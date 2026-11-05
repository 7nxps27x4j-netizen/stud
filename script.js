const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const now = new Date();
const REAL_YEAR = now.getFullYear();
const REAL_MONTH = now.getMonth();
const REAL_DATE = now.getDate();

let currentYear = REAL_YEAR;
let currentMonth = REAL_MONTH;

const STORAGE_KEY_MASTER = 'my_habits_master_list';
const STORAGE_KEY_HISTORY = 'my_habits_history_snapshots';

let habitsMaster = JSON.parse(localStorage.getItem(STORAGE_KEY_MASTER)) || [
  { id: 1, name: 'Wake up at 06:00' },
  { id: 2, name: 'Meditation' },
  { id: 3, name: 'Gym' },
  { id: 4, name: 'Cold shower' },
  { id: 5, name: 'Deep work' },
  { id: 6, name: 'Read 10 pages' },
  { id: 7, name: 'Learn a skill' },
  { id: 8, name: 'Sleep before 23:00' }
];

let historySnapshots = JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY)) || {};

let trendChartInstance = null;

function getAccentColor() {
  return getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
}

function saveMaster() {
  localStorage.setItem(STORAGE_KEY_MASTER, JSON.stringify(habitsMaster));
}

function saveSnapshots() {
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(historySnapshots));
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getMonthSnapshot(year, month) {
  const monthKey = `${year}-${month + 1}`;
  if (!historySnapshots[monthKey]) {
    historySnapshots[monthKey] = {};
  }
  return historySnapshots[monthKey];
}

function seedInitialSnapshot() {
  const monthKey = `${REAL_YEAR}-${REAL_MONTH + 1}`;
  if (!historySnapshots[monthKey] || Object.keys(historySnapshots[monthKey]).length === 0) {
    const snap = {};
    const daysInCurr = getDaysInMonth(REAL_YEAR, REAL_MONTH);

    habitsMaster.forEach(h => {
      snap[h.id] = {};
      for (let day = 1; day <= daysInCurr; day++) {
        const rand = Math.random();
        if (rand > 0.5) snap[h.id][day] = 'completed';
        else if (rand > 0.3) snap[h.id][day] = 'missed';
        else if (rand > 0.15) snap[h.id][day] = 'not-scheduled';
        else snap[h.id][day] = 'upcoming';
      }
    });

    historySnapshots[monthKey] = snap;
    saveSnapshots();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  seedInitialSnapshot();
  initDateSelectors();
  renderHeaderDays();
  renderMatrix();
  initChart();
  updateAll();

  document.getElementById('addHabitBtn').addEventListener('click', () => {
    if (isHistoricalMonth()) return;

    const name = prompt('새로운 습관명을 입력하세요:');
    if (name && name.trim()) {
      const newHabit = { id: Date.now(), name: name.trim() };
      habitsMaster.push(newHabit);
      saveMaster();
      renderMatrix();
      updateAll();
    }
  });
});

function isHistoricalMonth() {
  if (currentYear < REAL_YEAR) return true;
  if (currentYear === REAL_YEAR && currentMonth < REAL_MONTH) return true;
  return false;
}

function initDateSelectors() {
  const monthSelect = document.getElementById('monthSelect');
  const yearSelect = document.getElementById('yearSelect');

  monthSelect.innerHTML = '';
  MONTH_NAMES.forEach((mName, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = mName;
    if (idx === currentMonth) opt.selected = true;
    monthSelect.appendChild(opt);
  });

  yearSelect.innerHTML = '';
  const opt = document.createElement('option');
  opt.value = 2026;
  opt.textContent = '2026';
  opt.selected = true;
  yearSelect.appendChild(opt);

  monthSelect.addEventListener('change', (e) => {
    currentMonth = parseInt(e.target.value);
    onDateChange();
  });

  yearSelect.addEventListener('change', (e) => {
    currentYear = parseInt(e.target.value);
    onDateChange();
  });
}

function onDateChange() {
  renderHeaderDays();
  renderMatrix();
  updateAll();
}

function renderHeaderDays() {
  const tr = document.getElementById('matrixHeaderDays');
  tr.innerHTML = '<th class="habit-col-head">MY HABITS</th>';

  const daysCount = getDaysInMonth(currentYear, currentMonth);
  const isRealCurrentMonth = (currentYear === REAL_YEAR && currentMonth === REAL_MONTH);

  for (let day = 1; day <= daysCount; day++) {
    const th = document.createElement('th');
    const dateObj = new Date(currentYear, currentMonth, day);
    const dayName = DAY_NAMES[dateObj.getDay()];
    const isToday = (isRealCurrentMonth && day === REAL_DATE);

    th.innerHTML = `
      <div class="header-day-cell">
        <span class="day-name">${dayName}</span>
        <span class="day-number ${isToday ? 'is-today-num' : ''}">${day}</span>
      </div>
    `;
    tr.appendChild(th);
  }

  const monthTagText = MONTH_NAMES[currentMonth].toUpperCase();
  document.getElementById('chartMonthTag').textContent = monthTagText;
  document.getElementById('analysisMonthTag').textContent = monthTagText;
  document.getElementById('topMonthTag').textContent = monthTagText;

  const isHistory = isHistoricalMonth();
  document.getElementById('readOnlyBadge').style.display = isHistory ? 'inline-block' : 'none';
  document.getElementById('addHabitBtn').disabled = isHistory;
}

function renderMatrix() {
  const tbody = document.getElementById('matrixBody');
  tbody.innerHTML = '';

  const daysCount = getDaysInMonth(currentYear, currentMonth);
  const isHistory = isHistoricalMonth();
  const snapshot = getMonthSnapshot(currentYear, currentMonth);

  let activeHabitsList = habitsMaster;
  if (isHistory && Object.keys(snapshot).length > 0) {
    const savedIds = Object.keys(snapshot).map(Number);
    activeHabitsList = habitsMaster.filter(h => savedIds.includes(h.id));
    savedIds.forEach(id => {
      if (!activeHabitsList.some(h => h.id === id)) {
        activeHabitsList.push({ id, name: `Habit #${id}` });
      }
    });
  }

  activeHabitsList.forEach((habit) => {
    const tr = document.createElement('tr');

    const nameTd = document.createElement('td');
    nameTd.className = 'habit-name-td';
    nameTd.innerHTML = `
      <span>${habit.name}</span>
      ${!isHistory ? `<button class="delete-btn" onclick="deleteHabit(${habit.id})">✕</button>` : ''}
    `;
    tr.appendChild(nameTd);

    if (!snapshot[habit.id]) snapshot[habit.id] = {};

    for (let day = 1; day <= daysCount; day++) {
      const td = document.createElement('td');
      const btn = document.createElement('div');
      btn.className = 'cell-btn';

      if (isHistory) btn.classList.add('is-disabled');

      const status = snapshot[habit.id][day] || 'upcoming';

      if (status === 'completed') {
        btn.classList.add('status-completed');
        btn.textContent = '✓';
      } else if (status === 'missed') {
        btn.classList.add('status-missed');
        btn.textContent = '';
      } else if (status === 'not-scheduled') {
        btn.classList.add('status-not-scheduled');
        btn.textContent = '•';
      } else {
        btn.classList.add('status-upcoming');
        btn.textContent = '';
      }

      if (!isHistory) {
        btn.addEventListener('click', () => {
          const cur = snapshot[habit.id][day] || 'upcoming';
          if (cur === 'completed') snapshot[habit.id][day] = 'missed';
          else if (cur === 'missed') snapshot[habit.id][day] = 'not-scheduled';
          else if (cur === 'not-scheduled') snapshot[habit.id][day] = 'upcoming';
          else snapshot[habit.id][day] = 'completed';

          saveSnapshots();
          renderMatrix();
          updateAll();
        });
      }

      td.appendChild(btn);
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  });
}

function deleteHabit(id) {
  if (isHistoricalMonth()) return;

  if (confirm('이 습관을 삭제하시겠습니까?')) {
    habitsMaster = habitsMaster.filter(h => h.id !== id);
    saveMaster();
    renderMatrix();
    updateAll();
  }
}

function updateAll() {
  const daysCount = getDaysInMonth(currentYear, currentMonth);
  const snapshot = getMonthSnapshot(currentYear, currentMonth);
  const activeHabitsList = Object.keys(snapshot);
  const totalHabitsCount = activeHabitsList.length || habitsMaster.length;

  document.getElementById('activeHabitsCount').textContent = totalHabitsCount;
  document.getElementById('daysTracked').textContent = daysCount;

  const isRealCurrentMonth = (currentYear === REAL_YEAR && currentMonth === REAL_MONTH);
  const activeToday = isRealCurrentMonth ? REAL_DATE : 1;

  let todayDone = 0;
  let todayActiveScheduled = 0;

  Object.keys(snapshot).forEach(hId => {
    const st = snapshot[hId][activeToday] || 'upcoming';
    if (st !== 'not-scheduled') {
      todayActiveScheduled++;
      if (st === 'completed') todayDone++;
    }
  });

  const todayPercent = todayActiveScheduled ? Math.round((todayDone / todayActiveScheduled) * 100) : 0;
  document.getElementById('todayPercent').textContent = `${todayPercent}%`;
  document.getElementById('todaySub').textContent = `${todayDone}/${todayActiveScheduled} habits`;
  setRingProgress('todayRing', todayPercent);

  const weeklyContainer = document.getElementById('weeklyBars');
  weeklyContainer.innerHTML = '';
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  let weekDoneSum = 0;

  const startDay = Math.max(1, activeToday - 3);
  const accentColor = getAccentColor();

  dayLabels.forEach((label, idx) => {
    const targetDay = Math.min(daysCount, startDay + idx);
    let doneInDay = 0;
    let scheduledInDay = 0;

    Object.keys(snapshot).forEach(hId => {
      const st = snapshot[hId][targetDay] || 'upcoming';
      if (st !== 'not-scheduled') {
        scheduledInDay++;
        if (st === 'completed') doneInDay++;
      }
    });

    const dayPct = scheduledInDay ? (doneInDay / scheduledInDay) * 100 : 0;
    weekDoneSum += dayPct;

    const isTodayBar = (isRealCurrentMonth && targetDay === REAL_DATE);
    const barColor = isTodayBar ? accentColor : '#444444';

    const col = document.createElement('div');
    col.className = 'bar-col';
    col.innerHTML = `
      <div class="bar-bg">
        <div class="bar-fill" style="height: ${dayPct}%; background-color: ${barColor};"></div>
      </div>
      <span class="bar-label">${label}</span>
    `;
    weeklyContainer.appendChild(col);
  });

  const avgWeekPct = Math.round(weekDoneSum / 7);
  document.getElementById('weekPercent').textContent = `${avgWeekPct}%`;

  let totalScheduledInMonth = 0;
  let totalCompletedInMonth = 0;
  let perfectDays = 0;

  for (let d = 1; d <= daysCount; d++) {
    let dayDone = 0;
    let dayScheduled = 0;

    Object.keys(snapshot).forEach(hId => {
      const st = snapshot[hId][d] || 'upcoming';
      if (st !== 'not-scheduled') {
        dayScheduled++;
        if (st === 'completed') {
          totalCompletedInMonth++;
          dayDone++;
        }
      }
    });

    totalScheduledInMonth += dayScheduled;

    if (dayScheduled > 0 && dayDone === dayScheduled) {
      perfectDays++;
    }
  }

  const monthPercent = totalScheduledInMonth ? Math.round((totalCompletedInMonth / totalScheduledInMonth) * 100) : 0;
  document.getElementById('monthPercent').textContent = `${monthPercent}%`;
  document.getElementById('monthSub').textContent = `${totalCompletedInMonth} of ${totalScheduledInMonth} scheduled`;
  document.getElementById('perfectDays').textContent = perfectDays;
  document.getElementById('avgDone').textContent = (totalCompletedInMonth / daysCount).toFixed(1);

  setRingProgress('monthRing', monthPercent);

  renderAnalysis();
  renderTopHabits();
  updateChartData();
}

function setRingProgress(elementId, percent) {
  const circle = document.getElementById(elementId);
  if (!circle) return;
  const circumference = 2 * Math.PI * 38;
  const offset = circumference - (percent / 100) * circumference;
  circle.style.strokeDashoffset = offset;
}

function renderAnalysis() {
  const container = document.getElementById('analysisList');
  container.innerHTML = '';
  const daysCount = getDaysInMonth(currentYear, currentMonth);
  const snapshot = getMonthSnapshot(currentYear, currentMonth);

  habitsMaster.forEach(h => {
    let done = 0;
    let scheduled = 0;

    if (snapshot[h.id]) {
      for (let d = 1; d <= daysCount; d++) {
        const st = snapshot[h.id][d] || 'upcoming';
        if (st !== 'not-scheduled') {
          scheduled++;
          if (st === 'completed') done++;
        }
      }
    }

    const percent = scheduled ? Math.round((done / scheduled) * 100) : 0;

    const item = document.createElement('div');
    item.className = 'analysis-item';
    item.innerHTML = `
      <div class="analysis-item-head">
        <span>${h.name}</span>
        <span>${percent}%</span>
      </div>
      <div class="progress-bg">
        <div class="progress-fill" style="width: ${percent}%;"></div>
      </div>
    `;
    container.appendChild(item);
  });
}

function renderTopHabits() {
  const container = document.getElementById('topList');
  container.innerHTML = '';
  const daysCount = getDaysInMonth(currentYear, currentMonth);
  const snapshot = getMonthSnapshot(currentYear, currentMonth);

  const list = habitsMaster.map(h => {
    let done = 0;
    let scheduled = 0;

    if (snapshot[h.id]) {
      for (let d = 1; d <= daysCount; d++) {
        const st = snapshot[h.id][d] || 'upcoming';
        if (st !== 'not-scheduled') {
          scheduled++;
          if (st === 'completed') done++;
        }
      }
    }
    return {
      name: h.name,
      done,
      scheduled,
      percent: scheduled ? Math.round((done / scheduled) * 100) : 0
    };
  }).sort((a, b) => b.done - a.done);

  list.slice(0, 5).forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'top-item';
    row.innerHTML = `
      <div class="top-left">
        <span class="top-rank">0${index + 1}</span>
        <span>${item.name}</span>
      </div>
      <div class="top-stats">
        <span class="top-percent">${item.percent}%</span>
        <div class="top-count">${item.done}/${item.scheduled || daysCount}</div>
      </div>
    `;
    container.appendChild(row);
  });
}

function initChart() {
  const ctx = document.getElementById('trendChart').getContext('2d');
  const accentColor = getAccentColor();

  trendChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Daily completion',
        data: [],
        borderColor: accentColor,
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#555', font: { size: 9 } } },
        y: {
          min: 0,
          max: 100,
          ticks: {
            color: '#555',
            font: { size: 9 },
            stepSize: 50,
            callback: v => v + '%'
          },
          grid: { color: '#161616' }
        }
      }
    }
  });
}

function updateChartData() {
  if (!trendChartInstance) return;

  trendChartInstance.data.datasets[0].borderColor = getAccentColor();

  const daysCount = getDaysInMonth(currentYear, currentMonth);
  const snapshot = getMonthSnapshot(currentYear, currentMonth);

  const targetDays = [1, 5, 10, 15, 20, 25];
  if (daysCount <= 29) {
    targetDays.push(daysCount);
  } else {
    targetDays.push(30);
  }

  const labels = [];
  const data = [];

  targetDays.forEach(d => {
    labels.push(d);
    let done = 0;
    let scheduled = 0;

    Object.keys(snapshot).forEach(hId => {
      const st = snapshot[hId][d] || 'upcoming';
      if (st !== 'not-scheduled') {
        scheduled++;
        if (st === 'completed') done++;
      }
    });

    const pct = scheduled ? Math.round((done / scheduled) * 100) : 0;
    data.push(pct);
  });

  trendChartInstance.data.labels = labels;
  trendChartInstance.data.datasets[0].data = data;
  trendChartInstance.update();
}
