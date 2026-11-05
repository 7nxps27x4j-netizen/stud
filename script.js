function updateAll() {
  const daysCount = getDaysInMonth(currentYear, currentMonth);
  const snapshot = getMonthSnapshot(currentYear, currentMonth);
  
  // 수정된 부분: snapshot 대신 전체 습관 마스터 목록(habitsMaster)의 길이를 정확하게 반영합니다.
  const totalHabitsCount = habitsMaster.length;

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
