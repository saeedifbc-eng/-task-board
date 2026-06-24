// ============================
// داده‌ها و توابع پایه
// ============================
let tasks = [];
let selectedDate = null;
let currentMonth = 0;

const persianMonths = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

const monthDays = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

function toPersianDate(gy, gm, gd) {
  const gDate = new Date(gy, gm - 1, gd);
  const gStart = new Date(2026, 2, 21);
  const diffDays = Math.floor((gDate - gStart) / (24*60*60*1000));
  if (diffDays < 0) return { year: 1404, month: 12, day: 30 + diffDays };
  
  let remaining = diffDays;
  let month = 0;
  while (remaining >= monthDays[month] && month < 11) {
    remaining -= monthDays[month];
    month++;
  }
  return { year: 1405, month: month + 1, day: remaining + 1 };
}

function toGregorian(py, pm, pd) {
  const gStart = new Date(2026, 2, 21);
  let days = pd - 1;
  for (let i = 0; i < pm - 1; i++) days += monthDays[i];
  const gDate = new Date(gStart);
  gDate.setDate(gDate.getDate() + days);
  return { year: gDate.getFullYear(), month: gDate.getMonth() + 1, day: gDate.getDate() };
}

function getTodayPersian() {
  const now = new Date();
  return toPersianDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

function formatPersianDate(py, pm, pd) {
  return `${pd} ${persianMonths[pm-1]} ${py}`;
}

function toDateKey(py, pm, pd) {
  return `${py}-${String(pm).padStart(2,'0')}-${String(pd).padStart(2,'0')}`;
}

// ============================
// دکمه تسک‌های امروز
// ============================
function goToToday() {
  const today = getTodayPersian();
  currentMonth = today.month - 1;
  document.getElementById("monthSelect").value = currentMonth;
  selectedDate = toDateKey(today.year, today.month, today.day);
  renderCalendar();
  showDayTasks(selectedDate);
  
  document.querySelector('.calendar-wrapper').scrollIntoView({ behavior: 'smooth' });
}

// ============================
// بارگذاری و ذخیره
// ============================
function loadTasks() {
  const data = localStorage.getItem("tasks");
  if (data) tasks = JSON.parse(data);
}
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// ============================
// تغییر ماه نمایش
// ============================
function changeMonth(delta) {
  currentMonth = (currentMonth + delta + 12) % 12;
  document.getElementById("monthSelect").value = currentMonth;
  renderCalendar();
}

// ============================
// افزودن تسک
// ============================
function addTask() {
  const title = document.getElementById("taskTitle").value.trim();
  const desc = document.getElementById("taskDesc").value.trim();
  const user = document.getElementById("taskUser").value;
  
  if (!selectedDate) {
    alert("لطفاً ابتدا یک روز را در تقویم انتخاب کنید");
    return;
  }
  
  const [year, month, day] = selectedDate.split('-').map(Number);
  
  if (!title) { alert("لطفاً عنوان تسک را وارد کنید"); return; }
  
  const dateKey = toDateKey(year, month, day);
  
  tasks.push({
    id: Date.now(),
    title,
    desc,
    user,
    date: dateKey,
    done: false
  });
  saveTasks();
  renderCalendar();
  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDesc").value = "";
  showDayTasks(dateKey);
}

// ============================
// رندر تقویم (بدون نقطه‌های رنگی)
// ============================
function renderCalendar() {
  const container = document.getElementById("calendarContainer");
  container.innerHTML = "";
  
  const userFilter = document.getElementById("filterUser").value;
  const dayFilter = document.getElementById("filterDay").value;
  
  const year = 1405;
  const m = currentMonth;
  
  const monthDiv = document.createElement("div");
  monthDiv.className = "month-grid";
  
  const title = document.createElement("div");
  title.className = "month-title";
  title.textContent = persianMonths[m];
  monthDiv.appendChild(title);
  
  const weekdays = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
  const wdDiv = document.createElement("div");
  wdDiv.className = "weekdays";
  weekdays.forEach(w => { const span = document.createElement("span"); span.textContent = w; wdDiv.appendChild(span); });
  monthDiv.appendChild(wdDiv);
  
  let totalDaysBefore = 0;
  for (let i = 0; i < m; i++) totalDaysBefore += monthDays[i];
  let firstDayOfMonth = (0 + totalDaysBefore) % 7;
  
  const daysGrid = document.createElement("div");
  daysGrid.className = "days-grid";
  
  for (let i = 0; i < firstDayOfMonth; i++) {
    const empty = document.createElement("div");
    empty.className = "day-cell empty-cell";
    daysGrid.appendChild(empty);
  }
  
  const today = getTodayPersian();
  const todayDate = new Date();
  const todayTimestamp = todayDate.getTime();
  
  for (let d = 1; d <= monthDays[m]; d++) {
    const cell = document.createElement("div");
    cell.className = "day-cell";
    
    const dateKey = toDateKey(year, m+1, d);
    
    // محاسبه تاریخ میلادی برای مقایسه با امروز
    const gDate = toGregorian(year, m+1, d);
    const cellDate = new Date(gDate.year, gDate.month - 1, gDate.day);
    const cellTimestamp = cellDate.getTime();
    const isPast = cellTimestamp < todayTimestamp && !(today.year === year && today.month === m+1 && today.day === d);
    const isToday = (today.year === year && today.month === m+1 && today.day === d);
    
    // دریافت تسک‌های این روز
    const dayTasks = tasks.filter(t => t.date === dateKey);
    const hasUnfinished = dayTasks.some(t => t.done === false);
    const allDone = dayTasks.length > 0 && dayTasks.every(t => t.done === true);
    
    // ==============================================
    // رنگ‌بندی سلول بر اساس قوانین
    // ==============================================
    if (isToday) {
      // امروز: همیشه زرد
      cell.style.background = "#2a2a1a";
      cell.style.borderColor = "#ffbb33";
      cell.classList.add("today");
    } else if (isPast) {
      // روزهای گذشته
      if (dayTasks.length === 0) {
        // بدون تسک: خاکستری معمولی
        cell.style.background = "#1f1f2e";
      } else if (allDone) {
        // همه تسک‌ها انجام شده: سبز
        cell.style.background = "#1a3a2a";
        cell.style.borderColor = "#2e7d32";
        cell.classList.add("all-done");
      } else if (hasUnfinished) {
        // تسک انجام‌نشده دارد: نارنجی 🔶
        cell.style.background = "#3d2a1a";
        cell.style.borderColor = "#e67e22";
        cell.classList.add("has-unfinished");
      }
    } else {
      // روزهای آینده: خاکستری معمولی
      cell.style.background = "#1f1f2e";
    }
    
    // شماره روز
    const numSpan = document.createElement("span");
    numSpan.className = "day-number";
    numSpan.textContent = d;
    cell.appendChild(numSpan);
    
    // دایره سبز برای روز انتخاب‌شده
    if (selectedDate === dateKey) {
      const dot = document.createElement("span");
      dot.className = "selected-dot";
      cell.appendChild(dot);
    }
    
    // کلیک روی روز
    cell.addEventListener("click", () => {
      selectedDate = dateKey;
      renderCalendar();
      showDayTasks(dateKey);
    });
    
    daysGrid.appendChild(cell);
  }
  
  monthDiv.appendChild(daysGrid);
  container.appendChild(monthDiv);
}

// ============================
// نمایش تسک‌های یک روز
// ============================
function showDayTasks(dateKey) {
  const listDiv = document.getElementById("dayTaskList");
  const titleEl = document.querySelector("#dayDetail h3");
  
  const [y, m, d] = dateKey.split('-').map(Number);
  titleEl.textContent = `📌 تسک‌های ${formatPersianDate(y, m, d)}`;
  
  const userFilter = document.getElementById("filterUser").value;
  const dayFilter = document.getElementById("filterDay").value;
  
  let filtered = tasks.filter(t => {
    if (t.date !== dateKey) return false;
    if (userFilter !== "All" && t.user !== userFilter) return false;
    if (dayFilter !== "All") {
      const g = toGregorian(y, m, d);
      const dayName = ["Saturday","Sunday","Monday","Tuesday","Wednesday","Thursday","Friday"][new Date(g.year, g.month-1, g.day).getDay()];
      if (dayFilter !== dayName) return false;
    }
    return true;
  });
  
  if (filtered.length === 0) {
    listDiv.innerHTML = `<p style="color:#aaa; font-size:0.85rem;">✨ هیچ تسکی برای این روز نیست</p>`;
    return;
  }
  
  listDiv.innerHTML = "";
  filtered.forEach(task => {
    const card = document.createElement("div");
    const userClass = task.user === 'Saeed' ? 'user-saeed' : 'user-mohammadreza';
    const badgeClass = task.user === 'Saeed' ? 'saeed' : 'mohammadreza';
    card.className = `task-card ${userClass} ${task.done ? "done" : ""}`;
    
    card.innerHTML = `
      <div class="task-info">
        <b>
          <span class="user-badge ${badgeClass}">${task.user}</span>
          ${task.title}
        </b>
        <small>${task.desc || ''}</small>
      </div>
      <div class="task-actions">
        <button class="btn-done" onclick="toggleDone(${task.id})">${task.done ? '✔ انجام شد' : '✓ انجام شد'}</button>
        <button onclick="editTask(${task.id})">✎</button>
        <button class="btn-del" onclick="deleteTask(${task.id})">✖</button>
      </div>
    `;
    listDiv.appendChild(card);
  });
}

// ============================
// عملیات روی تسک‌ها
// ============================
function toggleDone(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
  saveTasks();
  renderCalendar();
  if (selectedDate) showDayTasks(selectedDate);
}

function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  const newTitle = prompt("عنوان جدید:", task.title);
  if (newTitle !== null) task.title = newTitle.trim() || task.title;
  const newDesc = prompt("توضیحات جدید:", task.desc);
  if (newDesc !== null) task.desc = newDesc.trim();
  saveTasks();
  renderCalendar();
  if (selectedDate) showDayTasks(selectedDate);
}

function deleteTask(id) {
  if (!confirm("آیا این تسک حذف شود؟")) return;
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderCalendar();
  if (selectedDate) showDayTasks(selectedDate);
}

// ============================
// مقداردهی اولیه
// ============================
loadTasks();
const today = getTodayPersian();
currentMonth = today.month - 1;
document.getElementById("monthSelect").value = currentMonth;
selectedDate = toDateKey(today.year, today.month, today.day);
renderCalendar();
showDayTasks(selectedDate);