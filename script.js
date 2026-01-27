let totalSeconds = 0;
let timerInterval = null;
let dailyData = JSON.parse(localStorage.getItem('studyData_V1')) || {};
let hData = JSON.parse(localStorage.getItem('hData_V3')) || { 
    names: Array(10).fill(""), 
    checks: Array(10).fill().map(() => Array(31).fill(false)) 
};
let hChartObj = null;

// [추가] 동기부여 명언 리스트
const quotes = [
    "기적은 노력의 또 다른 이름이다.",
    "오늘 걷지 않으면 내일은 뛰어야 한다.",
    "할 수 있다고 믿는 사람은 결국 그렇게 된다.",
    "가장 어두운 밤도 결국 끝나고 해가 뜰 것이다.",
    "공부할 때의 고통은 잠깐이지만, 못 배운 고통은 평생이다.",
    "꿈을 실현하기에 가장 좋은 날은 바로 오늘이다.",
    "한 번도 실수를 해보지 않은 사람은 한 번도 새로운 것을 시도한 적이 없다.",
    "성공은 매일 반복되는 작은 노력의 합계다.",
    "지금 자면 꿈을 꾸지만, 지금 공부하면 꿈을 이룬다.",
    "성공은 매일 반복되는 작은 노력의 합이다.",
    "할 수 있다고 믿으면 이미 절반은 온 것이다.",
    "당신의 노력이 오늘의 당신을 만든다.",
    "내가 헛되이 보낸 오늘은 어제 죽은 이가 갈망하던 내일이다.",
    "공부할 때의 고통은 잠깐이지만 못 배운 고통은 평생이다.",
    "기적을 바라기보다 지금 당장 바뀌어야 한다.",
    "성공은 끝이 아니며, 실패는 치명적이지 않습니다. 중요한 것은 계속해 나가는 용기이다.",
    "완벽함은 도달할 수 없다. 하지만 완벽함을 쫓으면 우수함을 달성할 수 있다.",
    "성공은 실패에서 실패로 넘어가면서도 열정을 잃지 않는 것이다.",
    "목표 설정은 매력적인 미래를 만드는 비밀이다.",
    "실패는 성공보다 더 많은 것을 가르쳐준다. 실패가 당신을 멈추게 하지 마라. 실패는 인격을 만든다.",
    "생각을 모두 지금 하고 있는 일에 집중하라. 태양의 빛도 한 점에 모아야 불이 된다.",
    "목표를 세우는 건 보이지 않는 것을 보이는 것으로 바꾸는 첫걸음이다.",
    "자기 자신을 이기는 사람이 가장 강한 전사다.",
    "현명한 사람은 가지지 못한 것 때문에 슬퍼하지 않고, 가진 것에 기뻐한다.",
    "매일 아침 결단력을 가지고 일어나지 않으면, 만족감을 느끼고 잠자리에 들 수 없다.",
    "교육은 세상을 바꿀 수 있는 가장 강력한 무기다.",
    "가장 어려운 건 행동하기로 결정하는 것이다. 나머지는 단지 끈기일 뿐이다.",
   "교육은 세상에서 유일하게 자유롭게 얻을 수 있는 것이다. 그리고 그것은 당신이 얼마든지 가져갈 수 있는 거의 유일한 것이다.",
    "학생의 자세를 가져라. 질문하기에 너무 거만하지 말고, 새로운 걸 배우기엔 너무 많이 안다고 생각하지 마라.",
    "당신의 발을 올바른 자리에 두고, 그다음에 단호히 서라.",
    "완벽한 시간과 장소를 기다리지 마라. 당신은 이미 무대 위에 있다.",
    "어려움이 클수록, 그것을 극복하는 영광도 더욱 커진다.",
    "나는 학교 교육이 내 배움을 방해하도록 두지 않았다.",
    "성공은 대개 그것을 찾을 겨를도 없이 바쁘게 일하는 사람에게 찾아온다.",
    "가장 확실한 비결은 한 번 더 시도하는 것이다.",
    "당신의 노력을 믿으세요. 결코 당신을 배신하지 않을 것입니다."];

// 초기화 실행
window.onload = function() {
    changeQuote(); // 명언 변경
    updateDisplay();
    render2026Calendar();
    updateSummary();
};

// [추가] 명언을 랜덤으로 바꾸는 함수
function changeQuote() {
    const quoteElement = document.querySelector('.quote-text');
    if (quoteElement) {
        const randomIndex = Math.floor(Math.random() * quotes.length);
        quoteElement.innerText = `"${quotes[randomIndex]}"`;
    }
}

function getTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTime(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sc = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')}`;
}

function startTimer() {
    document.getElementById('startBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;
    timerInterval = setInterval(() => {
        totalSeconds++;
        document.getElementById('stopwatchDisplay').innerText = formatTime(totalSeconds);
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    const today = getTodayStr();
    const subject = document.getElementById('subjectSelect').value;
    if (!dailyData[today]) dailyData[today] = { total: 0, subjects: {} };
    dailyData[today].total += totalSeconds;
    dailyData[today].subjects[subject] = (dailyData[today].subjects[subject] || 0) + totalSeconds;
    localStorage.setItem('studyData_V1', JSON.stringify(dailyData));
    totalSeconds = 0;
    document.getElementById('stopwatchDisplay').innerText = "00:00:00";
    document.getElementById('startBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
    updateDisplay();
    render2026Calendar();
    updateSummary();
}

function updateDisplay() {
    const today = getTodayStr();
    const data = dailyData[today] || { subjects: {} };
    const list = document.getElementById('subjectTimeList');
    list.innerHTML = "";
    ['국어', '수학', '영어', '과학'].forEach(sub => {
        const time = data.subjects[sub] || 0;
        list.innerHTML += `<li><span>${sub}</span><strong>${formatTime(time)}</strong></li>`;
    });
}

function updateSummary() {
    const todayStr = getTodayStr();
    document.getElementById('todayTime').innerText = formatTime(dailyData[todayStr]?.total || 0);
    
    let monthTotal = 0;
    const currentMonthPrefix = todayStr.substring(0, 7);
    for(const date in dailyData) {
        if(date.startsWith(currentMonthPrefix)) monthTotal += dailyData[date].total;
    }
    document.getElementById('monthTime').innerText = formatTime(monthTotal);

    let streak = 0;
    let checkDate = new Date();
    while (true) {
        let dStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        if (dailyData[dStr] && dailyData[dStr].total > 0) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            if (streak === 0) {
                checkDate.setDate(checkDate.getDate() - 1);
                let yStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
                if (dailyData[yStr] && dailyData[yStr].total > 0) continue; 
            }
            break;
        }
    }
    document.getElementById('streakCount').innerText = `${streak}일`;
}

function render2026Calendar() {
    const container = document.getElementById('grassContainer');
    if(!container) return;
    container.innerHTML = "";
    const year = 2026, month = new Date().getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    document.getElementById('monthTitle').innerText = `2026년 ${month + 1}월`;
    for (let i = 0; i < firstDay; i++) container.appendChild(document.createElement('div'));
    for (let d = 1; d <= lastDate; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const time = dailyData[dateStr]?.total || 0;
        const cell = document.createElement('div');
        cell.className = 'grass-cell';
        if (time > 0) cell.classList.add(`lv-${Math.min(5, Math.ceil(time/3600))}`);
        cell.innerHTML = `<span class="cell-date">${d}</span>`;
        if(time > 0) {
            const m = Math.floor((time%3600)/60), s = time%60;
            cell.innerHTML += `<span class="cell-time-text">${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}</span>`;
        }
        container.appendChild(cell);
    }
}

function toggleMenu() { document.getElementById('side-menu').classList.toggle('open'); }

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(id + '-page').style.display = 'block';
    changeQuote(); // [추가] 탭을 이동할 때도 명언이 바뀜
    if(id === 'habit') renderH();
    toggleMenu();
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    document.body.classList.toggle('dark-mode');
    if(document.getElementById('habit-page').style.display === 'block') upHChart();
}

function renderH() {
    const head = document.getElementById('h-date-row');
    if(head.children.length === 1) { for(let i=1; i<=31; i++) head.innerHTML += `<th>${i}</th>`; }
    const body = document.getElementById('h-body');
    body.innerHTML = '';
    for(let i=0; i<10; i++) {
        let tr = document.createElement('tr');
        tr.innerHTML = `<td><input class="h-input" value="${hData.names[i]}" onchange="svH(${i},'n',this.value)" placeholder="습관 입력..."></td>`;
        for(let j=0; j<31; j++) tr.innerHTML += `<td><input type="checkbox" ${hData.checks[i][j]?'checked':''} onchange="svH(${i},${j},this.checked)"></td>`;
        body.appendChild(tr);
    }
    setTimeout(upHChart, 50);
}

function svH(r, c, v) {
    if(c === 'n') hData.names[r] = v; else hData.checks[r][c] = v;
    localStorage.setItem('hData_V3', JSON.stringify(hData));
    upHChart();
}

function upHChart() {
    const ctx = document.getElementById('h-chart').getContext('2d');
    const isDark = document.body.classList.contains('dark-mode');
    const scores = Array(31).fill(0).map((_, d) => {
        let cnt = 0; for(let i=0; i<10; i++) if(hData.checks[i][d]) cnt++; return cnt;
    });
    if(hChartObj) hChartObj.destroy();
    hChartObj = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length:31}, (_, i) => i+1),
            datasets: [{ label: '완료', data: scores, borderColor: '#f97316', backgroundColor: 'rgba(249,115,22,0.1)', fill: true, tension: 0.3 }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 10, ticks: {color: isDark ? '#ccc' : '#666'} }, x: { ticks: {color: isDark ? '#ccc' : '#666'} } } }
    });
}


