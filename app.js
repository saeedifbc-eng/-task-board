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
// افزودن تسک (با انتخاب تاریخ از تقویم)
// ============================
function addTask() {
  const title = document.getElementById("taskTitle").value.trim();
  const desc = document.getElementById("taskDesc").value.trim();
  const user = document.getElementById("taskUser").value;
  const day = parseInt(document.getElementById("taskDay").value);
  const month = parseInt(document.getElementById("taskMonth").value);
  const year = 1405;
  
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
// رندر تقویم (فقط ماه جاری)
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
  for (let d = 1; d <= monthDays[m]; d++) {
    const cell = document.createElement("div");
    cell.className = "day-cell";
    
    const dateKey = toDateKey(year, m+1, d);
    
    let hasTask = tasks.some(t => {
      if (t.date !== dateKey) return false;
      if (userFilter !== "All" && t.user !== userFilter) return false;
      if (dayFilter !== "All") {
        const g = toGregorian(year, m+1, d);
        const dayName = ["Saturday","Sunday","Monday","Tuesday","Wednesday","Thursday","Friday"][new Date(g.year, g.month-1, g.day).getDay()];
        if (dayFilter !== dayName) return false;
      }
      return true;
    });
    
    if (hasTask) cell.classList.add("has-task");
    if (today.year === year && today.month === m+1 && today.day === d) cell.classList.add("today");
    
    const numSpan = document.createElement("span");
    numSpan.className = "day-number";
    numSpan.textContent = d;
    cell.appendChild(numSpan);
    
    if (hasTask) {
      const ind = document.createElement("span");
      ind.className = "task-indicator";
      ind.textContent = "📌";
      cell.appendChild(ind);
    }
    
    // کلیک روی روز: نمایش تسک‌ها و انتخاب تاریخ در فرم
    cell.addEventListener("click", () => {
      selectedDate = dateKey;
      showDayTasks(dateKey);
      
      // تنظیم منوهای روز و ماه در فرم افزودن تسک
      document.getElementById("taskDay").value = d;
      document.getElementById("taskMonth").value = m + 1;
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
    listDiv.innerHTML = `<p style="color:#aaa;">✨ هیچ تسکی برای این روز نیست</p>`;
    return;
  }
  
  listDiv.innerHTML = "";
  filtered.forEach(task => {
    const card = document.createElement("div");
    card.className = `task-card ${task.done ? "done" : ""}`;
    card.innerHTML = `
      <b>${task.title}</b>
      <small>${task.user} ${task.desc ? '| '+task.desc : ''}</small>
      <div class="actions">
        <button class="btn-done" onclick="toggleDone(${task.id})">${task.done ? '✔ انجام شد' : '✓ انجام شد'}</button>
        <button onclick="editTask(${task.id})">✎ ویرایش</button>
        <button class="btn-del" onclick="deleteTask(${task.id})">✖ حذف</button>
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
renderCalendar();
selectedDate = toDateKey(today.year, today.month, today.day);
showDayTasks(selectedDate);

// تنظیم فرم با تاریخ امروز
document.getElementById("taskDay").value = today.day;
document.getElementById("taskMonth").value = today.month;