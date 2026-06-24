// ============================
// داده‌ها و توابع پایه
// ============================
let tasks = [];
let selectedDate = null;
let currentMonth = 0;
let selectedUser = "Saeed";
let filterUser = "All";

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
// انتخاب کاربر در فرم
// ============================
function selectUser(btn) {
  const buttons = document.querySelectorAll("#userToggle button");
  buttons.forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
  selectedUser = btn.getAttribute("data-user");
}

// ============================
// فیلتر کاربر
// ============================
function setFilter(btn) {
  const buttons = document.querySelectorAll("#filterBar button");
  buttons.forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
  filterUser = btn.getAttribute("data-filter");
  renderCalendar();
  if (selectedDate) showDayTasks(selectedDate);
}

// ============================
// توابع مرحله‌ای فرم
// ============================
function nextStep() {
  const title = document.getElementById("taskTitle").value.trim();
  if (!title) {
    alert("لطفاً عنوان تسک را وارد کنید");
    return;
  }
  document.getElementById("step1").classList.remove("active");
  document.getElementById("step2").classList.add("active");
  document.getElementById("taskDesc").focus();
}

function prevStep() {
  document.getElementById("step2").classList.remove("active");
  document.getElementById("step1").classList.add("active");
  document.getElementById("taskTitle").focus();
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
  
  if (!selectedDate) {
    alert("لطفاً ابتدا یک روز را در تقویم انتخاب کنید");
    return;
  }
  if (!title) { 
    alert("لطفاً عنوان تسک را وارد کنید");
    return; 
  }
  
  const [year, month, day] = selectedDate.split('-').map(Number);
  const dateKey = toDateKey(year, month, day);
  
  tasks.push({
    id: Date.now(),
    title,
    desc,
    user: selectedUser,
    date: dateKey,
    done: false
  });
  saveTasks();
  renderCalendar();
  
  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDesc").value = "";
  document.getElementById("step2").classList.remove("active");
  document.getElementById("step1").classList.add("active");
  document.getElementById("taskTitle").focus();
  
  showDayTasks(dateKey);
}

// ============================
// باز/بسته کردن توضیحات کارت
// ============================
function toggleCard(cardEl, event) {
  event.stopPropagation();
  cardEl.classList.toggle("expanded");
}

// ============================
// رندر تقویم
// ============================
function renderCalendar() {
  const container = document.getElementById("calendarContainer");
  container.innerHTML = "";
  
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
    
    const gDate = toGregorian(year, m+1, d);
    const cellDate = new Date(gDate.year, gDate.month - 1, gDate.day);
    const cellTimestamp = cellDate.getTime();
    const isPast = cellTimestamp < todayTimestamp && !(today.year === year && today.month === m+1 && today.day === d);
    const isToday = (today.year === year && today.month === m+1 && today.day === d);
    
    // اعمال فیلتر کاربر روی وضعیت روزها
    let dayTasks = tasks.filter(t => t.date === dateKey);
    if (filterUser !== "All") {
      dayTasks = dayTasks.filter(t => t.user === filterUser);
    }
    const hasUnfinished = dayTasks.some(t => t.done === false);
    const allDone = dayTasks.length > 0 && dayTasks.every(t => t.done === true);
    
    if (isToday) {
      cell.style.background = "#2a2a1a";
      cell.style.borderColor = "#ffbb33";
      cell.classList.add("today");
    } else if (isPast) {
      if (dayTasks.length === 0) {
        cell.style.background = "#1f1f2e";
      } else if (allDone) {
        cell.style.background = "#1a3a2a";
        cell.style.borderColor = "#2e7d32";
        cell.classList.add("all-done");
      } else if (hasUnfinished) {
        cell.style.background = "#3d2a1a";
        cell.style.borderColor = "#e67e22";
        cell.classList.add("has-unfinished");
      }
    } else {
      cell.style.background = "#1f1f2e";
    }
    
    const numSpan = document.createElement("span");
    numSpan.className = "day-number";
    numSpan.textContent = d;
    cell.appendChild(numSpan);
    
    if (selectedDate === dateKey) {
      const dot = document.createElement("span");
      dot.className = "selected-dot";
      cell.appendChild(dot);
    }
    
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
  titleEl.textContent = `تسک‌های ${formatPersianDate(y, m, d)}`;
  
  let filtered = tasks.filter(t => {
    if (t.date !== dateKey) return false;
    if (filterUser !== "All" && t.user !== filterUser) return false;
    return true;
  });
  
  if (filtered.length === 0) {
    listDiv.innerHTML = `<p style="color:#aaa; font-size:0.85rem;">هیچ تسکی برای این روز نیست</p>`;
    return;
  }
  
  listDiv.innerHTML = "";
  filtered.forEach(task => {
    const card = document.createElement("div");
    const userClass = task.user === 'Saeed' ? 'user-saeed' : 'user-mohammadreza';
    const badgeClass = task.user === 'Saeed' ? 'saeed' : 'mohammadreza';
    const hasDesc = task.desc && task.desc.length > 0;
    card.className = `task-card ${userClass} ${task.done ? "done" : ""} ${hasDesc ? "has-desc" : ""}`;
    
    let html = `
      <div class="task-info" onclick="toggleCard(this.parentElement, event)">
        <b>
          <span class="user-badge ${badgeClass}">${task.user}</span>
          ${task.title}
        </b>
        <small>${task.desc || ''}</small>
      </div>
      <span class="expand-hint" onclick="toggleCard(this.parentElement, event)">برای دیدن توضیحات کامل کلیک کنید</span>
    `;
    
    if (hasDesc) {
      html += `<div class="full-desc">${task.desc}</div>`;
    }
    
    html += `
      <div class="task-actions">
        <button class="btn-done" onclick="event.stopPropagation(); toggleDone(${task.id})">${task.done ? 'انجام شد' : 'انجام شود'}</button>
        <button onclick="event.stopPropagation(); editTask(${task.id})">ویرایش</button>
        <button class="btn-del" onclick="event.stopPropagation(); deleteTask(${task.id})">حذف</button>
      </div>
    `;
    
    card.innerHTML = html;
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
