// ==========================================================
// تنظیمات دیتابیس JSONBin و کاربران
// ==========================================================
const BIN_ID = "6a3c12b1da38895dfef890a0"; 
const BIN_KEY = "$2a$10$X.Tg/856vciIsWVk/OEnjeW65O6V9yXhpcMPpUA6.MuHUuM/PSy0O"; 

const USERS = {
  "saeedmasoudi": { pass: "S@eed1994", name: "Saeed", displayName: "سعید" },
  "mohammad": { pass: "mohammad212732", name: "Mohammadreza", displayName: "محمدرضا" }
};

// ============================
// داده‌ها و متغیرهای سراسری
// ============================
let tasks = [];
let chatMessages = [];
let leads = [];
let selectedDate = null;
let currentMonth = 0;
let selectedUser = "Saeed";
let filterUser = "All";
let isUrgent = false;
let loggedInUser = null;
let expandedTaskIds = new Set();

let lastNotifiedUrgentIds = '';
let lastNotifiedMsgId = null;

const persianMonths = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const monthDays = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

// ============================
// توابع تاریخ
// ============================
function toPersianDate(gy, gm, gd) {
  const gDate = new Date(gy, gm - 1, gd);
  const gStart = new Date(2026, 2, 21);
  const diffDays = Math.floor((gDate - gStart) / (24*60*60*1000));
  if (diffDays < 0) return { year: 1404, month: 12, day: 30 + diffDays };
  let remaining = diffDays; let month = 0;
  while (remaining >= monthDays[month] && month < 11) { remaining -= monthDays[month]; month++; }
  return { year: 1405, month: month + 1, day: remaining + 1 };
}

function toGregorian(py, pm, pd) {
  const gStart = new Date(2026, 2, 21); let days = pd - 1;
  for (let i = 0; i < pm - 1; i++) days += monthDays[i];
  const gDate = new Date(gStart); gDate.setDate(gDate.getDate() + days);
  return { year: gDate.getFullYear(), month: gDate.getMonth() + 1, day: gDate.getDate() };
}

function getTodayPersian() { const now = new Date(); return toPersianDate(now.getFullYear(), now.getMonth() + 1, now.getDate()); }
function formatPersianDate(py, pm, pd) { return `${pd} ${persianMonths[pm-1]} ${py}`; }
function toDateKey(py, pm, pd) { return `${py}-${String(pm).padStart(2,'0')}-${String(pd).padStart(2,'0')}`; }

function getNowPersianFull() {
  const now = new Date();
  const p = toPersianDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const timeStr = now.toLocaleTimeString('fa-IR', {hour:'2-digit', minute:'2-digit', hour12: false});
  return `${formatPersianDate(p.year, p.month, p.day)} - ${timeStr}`;
}

// ============================
// لاگین
// ============================
function checkSession() {
  const u = localStorage.getItem('appUser');
  if (u && USERS[u]) { loggedInUser = USERS[u].name; showApp(); }
  else { document.getElementById('loginView').style.display = 'flex'; document.getElementById('appView').style.display = 'none'; }
}

function doLogin() {
  const username = document.getElementById('loginUser').value.trim().toLowerCase();
  const password = document.getElementById('loginPass').value;
  if (USERS[username] && USERS[username].pass === password) {
    try { localStorage.setItem('appUser', username); } catch (e) {}
    loggedInUser = USERS[username].name; showApp();
  } else { document.getElementById('loginError').style.display = 'block'; }
}

function doLogout() {
  localStorage.removeItem('appUser'); loggedInUser = null;
  document.getElementById('loginUser').value = ''; document.getElementById('loginPass').value = '';
  document.getElementById('loginError').style.display = 'none'; checkSession();
}

function showApp() {
  document.getElementById('loginView').style.display = 'none'; document.getElementById('appView').style.display = 'block';
  loadTasks(); const today = getTodayPersian(); currentMonth = today.month - 1;
  document.getElementById("monthSelect").value = currentMonth;
  selectedDate = toDateKey(today.year, today.month, today.day);
}

// ============================
// ارتباط با سرور JSONBin
// ============================
async function loadTasks() {
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, { headers: { 'X-Master-Key': BIN_KEY } });
    const data = await res.json();
    if (data && data.record && Array.isArray(data.record)) {
      tasks = data.record.filter(t => !t.temp && t.type !== 'chat' && t.type !== 'lead');
      chatMessages = data.record.filter(t => t.type === 'chat');
      leads = data.record.filter(t => t.type === 'lead');
    } else { tasks = []; chatMessages = []; leads = []; }
    refreshUI();
  } catch (error) { console.error("خطا در دریافت اطلاعات:", error); refreshUI(); }
}

async function saveTasks() {
  try {
    const all = [...tasks, ...chatMessages, ...leads];
    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Master-Key': BIN_KEY },
      body: JSON.stringify(all)
    });
  } catch (error) { console.error("خطا در ذخیره اطلاعات:", error); }
}

setInterval(() => { if(loggedInUser) loadTasks(); }, 3000);

// ============================
// اعلان‌ها
// ============================
function checkNotifications() {
  if (!loggedInUser) return;
  const today = getTodayPersian(); const todayKey = toDateKey(today.year, today.month, today.day);
  const lastMsg = chatMessages[chatMessages.length - 1];
  if (lastMsg && lastMsg.user !== loggedInUser && lastMsg.id !== lastNotifiedMsgId) {
    const userName = lastMsg.user === 'Saeed' ? 'سعید' : 'محمدرضا';
    if (Notification.permission === "granted") new Notification(`پیام جدید از ${userName}`, { body: lastMsg.text });
    lastNotifiedMsgId = lastMsg.id;
  }
  const urgentToday = tasks.filter(t => t.date === todayKey && t.urgent && !t.done);
  if (urgentToday.length > 0) {
    const currentUrgentIds = urgentToday.map(t => t.id).join(',');
    if (currentUrgentIds !== lastNotifiedUrgentIds) {
      if (Notification.permission === "granted") new Notification("تسک فوری!", { body: `شما ${urgentToday.length} تسک فوری برای امروز دارید.` });
      lastNotifiedUrgentIds = currentUrgentIds;
    }
  } else { lastNotifiedUrgentIds = ''; }
}
if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
setInterval(checkNotifications, 10000);

// ============================
// رفرش ظاهر
// ============================
function refreshUI() {
  renderCalendar();
  if (selectedDate) {
    if (document.getElementById("todayView").style.display === "block") renderTaskList(selectedDate, 'todayTaskList', 'todayTitle');
    else if (document.getElementById("chatView").style.display === "flex") renderChatMessages();
    else if (document.getElementById("dashView").style.display === "flex") renderDashboard();
    else if (document.getElementById("leadsView").style.display === "flex") renderLeads();
    else showDayTasks(selectedDate);
  }
}

// ============================
// توابع فرم و فیلتر
// ============================
function selectUser(btn) { const buttons = document.querySelectorAll("#userToggle button"); buttons.forEach(b => b.classList.remove("selected")); btn.classList.add("selected"); selectedUser = btn.getAttribute("data-user"); }
function setFilter(btn) { const buttons = document.querySelectorAll("#filterBar button"); buttons.forEach(b => b.classList.remove("selected")); btn.classList.add("selected"); filterUser = btn.getAttribute("data-filter"); renderCalendar(); if (selectedDate) showDayTasks(selectedDate); }
function toggleUrgent() { isUrgent = !isUrgent; document.getElementById('urgentToggle').classList.toggle('active', isUrgent); document.getElementById('urgentCheck').textContent = isUrgent ? '✓' : ''; }
function nextStep() { const title = document.getElementById("taskTitle").value.trim(); if (!title) { alert("لطفاً عنوان تسک را وارد کنید"); return; } document.getElementById("step1").classList.remove("active"); document.getElementById("step2").classList.add("active"); document.getElementById("taskDesc").focus(); }
function prevStep() { document.getElementById("step2").classList.remove("active"); document.getElementById("step1").classList.add("active"); document.getElementById("taskTitle").focus(); }
function nextStep2() { document.getElementById("step2").classList.remove("active"); document.getElementById("step3").classList.add("active"); }
function prevStep2() { document.getElementById("step3").classList.remove("active"); document.getElementById("step2").classList.add("active"); }

// ============================
// ناوبری
// ============================
function hideAllViews() {
  document.getElementById("mainView").style.display = "none"; document.getElementById("todayView").style.display = "none";
  document.getElementById("chatView").style.display = "none"; document.getElementById("dashView").style.display = "none";
  document.getElementById("leadsView").style.display = "none"; document.getElementById("taskForm").style.display = "none";
  document.querySelectorAll('.bnav-item').forEach(b => b.classList.remove('active'));
}

function goToToday() {
  const today = getTodayPersian(); const todayKey = toDateKey(today.year, today.month, today.day); selectedDate = todayKey;
  hideAllViews(); document.getElementById("todayView").style.display = "block"; document.getElementById("bnavToday").classList.add("active");
  renderTaskList(todayKey, 'todayTaskList', 'todayTitle'); window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openChat() {
  hideAllViews(); document.getElementById("chatView").style.display = "flex"; document.getElementById("bnavChat").classList.add("active");
  renderChatMessages(); window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openDash() {
  hideAllViews(); document.getElementById("dashView").style.display = "flex"; document.getElementById("bnavHome").classList.add("active");
  renderDashboard(); window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openLeads() {
  hideAllViews(); document.getElementById("leadsView").style.display = "flex"; document.getElementById("bnavLeads").classList.add("active");
  renderLeads(); window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goHome() {
  hideAllViews(); document.getElementById("mainView").style.display = "block"; document.getElementById("taskForm").style.display = "block";
  document.getElementById("bnavHome").classList.add("active"); const today = getTodayPersian(); currentMonth = today.month - 1;
  document.getElementById("monthSelect").value = currentMonth; renderCalendar(); if (selectedDate) showDayTasks(selectedDate);
}

function changeMonth(delta) { currentMonth = (currentMonth + delta + 12) % 12; document.getElementById("monthSelect").value = currentMonth; renderCalendar(); }

// ============================
// افزودن تسک
// ============================
async function addTask() {
  const title = document.getElementById("taskTitle").value.trim(); const desc = document.getElementById("taskDesc").value.trim();
  if (!selectedDate) { alert("لطفاً ابتدا یک روز را در تقویم انتخاب کنید"); return; } if (!title) { alert("لطفاً عنوان تسک را وارد کنید"); return; }
  const [year, month, day] = selectedDate.split('-').map(Number); const dateKey = toDateKey(year, month, day);
  tasks.push({ id: Date.now(), title, desc, user: selectedUser, date: dateKey, done: false, urgent: isUrgent });
  isUrgent = false; document.getElementById('urgentToggle').classList.remove('active'); document.getElementById('urgentCheck').textContent = '';
  await saveTasks(); document.getElementById("taskTitle").value = ""; document.getElementById("taskDesc").value = "";
  document.getElementById("step3").classList.remove("active"); document.getElementById("step1").classList.add("active");
  document.getElementById("taskTitle").focus(); refreshUI();
}

function toggleCard(cardEl, event) {
  event.stopPropagation();
  const id = parseInt(cardEl.dataset.taskId);
  if (expandedTaskIds.has(id)) {
    expandedTaskIds.delete(id);
  } else {
    expandedTaskIds.add(id);
  }
  showDayTasks(selectedDate);
}

// ============================
// رندر تقویم
// ============================
function renderCalendar() {
  const container = document.getElementById("calendarContainer"); container.innerHTML = ""; const year = 1405; const m = currentMonth;
  const monthDiv = document.createElement("div"); monthDiv.className = "month-grid";
  const yearBadge = document.createElement("div"); yearBadge.className = "year-badge"; yearBadge.textContent = "سال ۱۴۰۵ شمسی"; monthDiv.appendChild(yearBadge);
  const title = document.createElement("div"); title.className = "month-title"; title.textContent = persianMonths[m]; monthDiv.appendChild(title);
  const weekdays = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
  const wdDiv = document.createElement("div"); wdDiv.className = "weekdays"; weekdays.forEach(w => { const span = document.createElement("span"); span.textContent = w; wdDiv.appendChild(span); }); monthDiv.appendChild(wdDiv);
  let totalDaysBefore = 0; for (let i = 0; i < m; i++) totalDaysBefore += monthDays[i]; let firstDayOfMonth = (0 + totalDaysBefore) % 7;
  const daysGrid = document.createElement("div"); daysGrid.className = "days-grid";
  for (let i = 0; i < firstDayOfMonth; i++) { const empty = document.createElement("div"); empty.className = "day-cell empty-cell"; daysGrid.appendChild(empty); }
  const today = getTodayPersian(); const todayDate = new Date(); const todayTimestamp = todayDate.getTime();
  for (let d = 1; d <= monthDays[m]; d++) {
    const cell = document.createElement("div"); cell.className = "day-cell"; const dateKey = toDateKey(year, m+1, d);
    const gDate = toGregorian(year, m+1, d); const cellDate = new Date(gDate.year, gDate.month - 1, gDate.day); const cellTimestamp = cellDate.getTime();
    const isPast = cellTimestamp < todayTimestamp && !(today.year === year && today.month === m+1 && today.day === d);
    const isToday = (today.year === year && today.month === m+1 && today.day === d);
    let dayTasks = tasks.filter(t => t.date === dateKey); if (filterUser !== "All") dayTasks = dayTasks.filter(t => t.user === filterUser);
    const hasUnfinished = dayTasks.some(t => t.done === false); const allDone = dayTasks.length > 0 && dayTasks.every(t => t.done === true);
    if (isToday) { cell.style.background = "#2a2a1a"; cell.style.borderColor = "#ffbb33"; cell.classList.add("today"); }
    else if (isPast) { if (dayTasks.length === 0) cell.style.background = "#1f1f2e"; else if (allDone) { cell.style.background = "#1a3a2a"; cell.style.borderColor = "#2e7d32"; cell.classList.add("all-done"); } else if (hasUnfinished) { cell.style.background = "#3d2a1a"; cell.style.borderColor = "#e67e22"; cell.classList.add("has-unfinished"); } }
    else cell.style.background = "#1f1f2e";
    const numSpan = document.createElement("span"); numSpan.className = "day-number"; numSpan.textContent = d; cell.appendChild(numSpan);
    if (selectedDate === dateKey) { const dot = document.createElement("span"); dot.className = "selected-dot"; cell.appendChild(dot); }
    cell.addEventListener("click", () => { selectedDate = dateKey; renderCalendar(); showDayTasks(dateKey); }); daysGrid.appendChild(cell);
  } monthDiv.appendChild(daysGrid); container.appendChild(monthDiv);
}

// ============================
// ساخت کارت‌ها با مرتب‌سازی هوشمند
// ============================
function renderTaskList(dateKey, listId, titleId) {
  const listDiv = document.getElementById(listId); const titleEl = document.getElementById(titleId);
  const [y, m, d] = dateKey.split('-').map(Number); titleEl.textContent = `تسک‌های ${formatPersianDate(y, m, d)}`;
  let filtered = tasks.filter(t => { if (t.date !== dateKey) return false; if (filterUser !== "All" && t.user !== filterUser) return false; return true; });
  if (filtered.length === 0) { listDiv.innerHTML = `<p style="color:#aaa; font-size:0.85rem;">هیچ تسکی برای این روز نیست</p>`; return; }
  filtered.sort((a, b) => { const scoreA = (a.done ? 2 : 0) + (a.urgent ? 0 : 1); const scoreB = (b.done ? 2 : 0) + (b.urgent ? 0 : 1); return scoreA - scoreB; });
  listDiv.innerHTML = "";
  filtered.forEach(task => {
    const card = document.createElement("div"); const userClass = task.user === 'Saeed' ? 'user-saeed' : 'user-mohammadreza';
    const badgeClass = task.user === 'Saeed' ? 'saeed' : 'mohammadreza'; const hasDesc = task.desc && task.desc.length > 0;
    card.dataset.taskId = task.id;
    card.className = `task-card ${userClass} ${task.done ? "done" : ""} ${hasDesc ? "has-desc" : ""} ${expandedTaskIds.has(task.id) ? "expanded" : ""}`;
    let html = `<button class="task-close-btn" onclick="closeTaskCard(${task.id}, event)">✕</button>${task.urgent ? '<span class="urgent-badge">فوری</span>' : ''}
      <div class="task-info" onclick="toggleCard(this.parentElement, event)"><b><span class="user-badge ${badgeClass}">${task.user}</span>${task.title}</b><small>${task.desc || ''}</small></div>
      <span class="expand-hint" onclick="toggleCard(this.parentElement, event)">برای دیدن توضیحات کامل کلیک کنید</span>`;
    if (hasDesc) html += `<div class="full-desc">${task.desc}</div>`;
    html += `<div class="task-actions"><button class="btn-done" onclick="event.stopPropagation(); toggleDone(${task.id})">${task.done ? 'انجام شد' : 'انجام شود'}</button><button onclick="event.stopPropagation(); editTask(${task.id})">ویرایش</button><button class="btn-del" onclick="event.stopPropagation(); deleteTask(${task.id})">حذف</button></div>`;
    card.innerHTML = html; listDiv.appendChild(card);
  });
}

function showDayTasks(dateKey) { renderTaskList(dateKey, 'dayTaskList', 'dayTitle'); }

// ============================
// عملیات روی تسک‌ها
// ============================
async function toggleDone(id) { tasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t); await saveTasks(); refreshUI(); }
async function editTask(id) { const task = tasks.find(t => t.id === id); if (!task) return; const newTitle = prompt("عنوان جدید:", task.title); if (newTitle !== null) task.title = newTitle.trim() || task.title; const newDesc = prompt("توضیحات جدید:", task.desc); if (newDesc !== null) task.desc = newDesc.trim(); await saveTasks(); refreshUI(); }
async function deleteTask(id) { if (!confirm("آیا این تسک حذف شود؟")) return; tasks = tasks.filter(t => t.id !== id); await saveTasks(); refreshUI(); }

// ============================
// چت
// ============================
function renderChatMessages() {
  const container = document.getElementById("chatMessages");
  if (chatMessages.length === 0) { container.innerHTML = '<p style="color:#666;text-align:center;font-size:0.8rem;margin:auto;">هنوز پیامی ارسال نشده</p>'; return; }
  container.innerHTML = ""; const today = getTodayPersian(); const todayKey = toDateKey(today.year, today.month, today.day);
  const yG = new Date(); yG.setDate(yG.getDate() - 1); const yP = toPersianDate(yG.getFullYear(), yG.getMonth() + 1, yG.getDate()); const yesterdayKey = toDateKey(yP.year, yP.month, yP.day);
  let lastDate = null;
  chatMessages.forEach(msg => {
    const msgDate = msg.date || todayKey;
    if (msgDate !== lastDate) {
      const dateDiv = document.createElement("div"); dateDiv.className = "chat-date-divider";
      if (msgDate === todayKey) dateDiv.textContent = "امروز"; else if (msgDate === yesterdayKey) dateDiv.textContent = "دیروز";
      else { const [y, m, d] = msgDate.split('-').map(Number); dateDiv.textContent = formatPersianDate(y, m, d); }
      container.appendChild(dateDiv); lastDate = msgDate;
    }
    const div = document.createElement("div"); const userClass = msg.user === 'Saeed' ? 'saeed' : 'mohammadreza';
    const userName = msg.user === 'Saeed' ? 'سعید' : 'محمدرضا'; div.className = `chat-msg ${userClass}`;
    div.innerHTML = `<span class="chat-msg-user">${userName} - ${msg.time || ''}</span>${msg.text}`; container.appendChild(div);
  }); container.scrollTop = container.scrollHeight;
}

async function sendChat() {
  const input = document.getElementById("chatInput"); const text = input.value.trim(); if (!text) return;
  const now = new Date(); const pDate = getTodayPersian(); const todayKey = toDateKey(pDate.year, pDate.month, pDate.day);
  const timeStr = now.toLocaleTimeString('fa-IR', {hour:'2-digit', minute:'2-digit', hour12: false});
  chatMessages.push({ id: Date.now(), type: 'chat', user: loggedInUser, text: text, time: timeStr, date: todayKey });
  input.value = ""; await saveTasks(); renderChatMessages();
}

// ============================
// لیدها
// ============================
async function addLead() {
  const name = document.getElementById("leadName").value.trim();
  const phone = document.getElementById("leadPhone").value.trim();
  const desc = document.getElementById("leadDesc").value.trim();
  
  if (!name) { alert("لطفاً نام مشتری را وارد کنید"); return; }
  if (!phone) { alert("لطفاً شماره تماس را وارد کنید"); return; }
  
  const initialNote = desc ? { text: desc, time: getNowPersianFull() } : { text: 'ثبت اولیه لید', time: getNowPersianFull() };
  
  leads.push({ id: Date.now(), type: 'lead', name, phone, notes: [initialNote] });
  
  document.getElementById("leadName").value = "";
  document.getElementById("leadPhone").value = "";
  document.getElementById("leadDesc").value = "";
  document.getElementById("leadName").focus();
  
  await saveTasks();
  renderLeads();
}

async function editLeadInfo(id) {
  const lead = leads.find(l => l.id === id);
  if (!lead) return;
  const newName = prompt("نام جدید (برای انصراف خالی بگذارید):", lead.name);
  if (newName !== null && newName.trim() !== "") lead.name = newName.trim();
  const newPhone = prompt("شماره تماس جدید (برای انصراف خالی بگذارید):", lead.phone);
  if (newPhone !== null && newPhone.trim() !== "") lead.phone = newPhone.trim();
  await saveTasks();
  renderLeads();
}

async function addLeadNote(id) {
  const lead = leads.find(l => l.id === id);
  if (!lead) return;
  const text = prompt("متن یادداشت جدید:");
  if (text !== null && text.trim() !== "") {
    if (!lead.notes) lead.notes = [];
    lead.notes.push({ text: text.trim(), time: getNowPersianFull() });
    await saveTasks();
    renderLeads();
  }
}

async function deleteLead(id) {
  if (!confirm("آیا این لید و تمام پیگیری‌هایش حذف شود؟")) return;
  leads = leads.filter(l => l.id !== id);
  await saveTasks();
  renderLeads();
}

function renderLeads() {
  const container = document.getElementById("leadsList");
  const searchTerm = document.getElementById("leadSearchInput").value.trim().toLowerCase();

  let filteredLeads = leads;
  if (searchTerm) {
    filteredLeads = leads.filter(l => l.name.toLowerCase().includes(searchTerm));
  }

  if (filteredLeads.length === 0) {
    container.innerHTML = `<p style="color:#666; text-align:center; font-size:0.85rem; margin-top:20px; grid-column: span 2;">${searchTerm ? 'نتیجه‌ای یافت نشد' : 'هیچ لیدی ثبت نشده است'}</p>`;
    return;
  }

  container.innerHTML = "";
  filteredLeads.forEach(lead => {
    const card = document.createElement("div");
    card.className = "lead-card";
    
    card.innerHTML = `
      <div class="lead-header" onclick="openLeadModal(${lead.id})">
        <div>
          <b>${lead.name}</b><br>
          <span class="lead-phone-badge">${lead.phone}</span>
        </div>
        <a href="tel:${lead.phone}" class="btn-call" onclick="event.stopPropagation()">تماس</a>
      </div>
    `;
    container.appendChild(card);
  });
}

// ============================
// داشبورد هفتگی
// ============================
function getWeekRange() {
  const todayG = new Date(); const dayOfWeek = todayG.getDay(); const diffToSat = (dayOfWeek + 1) % 7;
  const startG = new Date(todayG); startG.setDate(todayG.getDate() - diffToSat); let dates = [];
  for (let i = 0; i < 7; i++) { const d = new Date(startG); d.setDate(startG.getDate() + i); const p = toPersianDate(d.getFullYear(), d.getMonth() + 1, d.getDate()); dates.push(toDateKey(p.year, p.month, p.day)); }
  return dates;
}

function renderDashboard() {
  const container = document.getElementById("dashStatsContainer"); const weekDates = getWeekRange();
  const weekTasks = tasks.filter(t => weekDates.includes(t.date)); const sTasks = weekTasks.filter(t => t.user === 'Saeed'); const mTasks = weekTasks.filter(t => t.user === 'Mohammadreza'); const unfinishedTasks = weekTasks.filter(t => !t.done);
  const sDone = sTasks.filter(t => t.done).length; const mDone = mTasks.filter(t => t.done).length; const totalDone = weekTasks.filter(t => t.done).length;
  container.innerHTML = `
    <div class="stat-row"><span>کل تسک‌های هفته</span><span class="stat-val" style="color:#fff">${weekTasks.length}</span></div>
    <div class="stat-row"><span>انجام شده</span><span class="stat-val" style="color:#4caf50">${totalDone}</span></div>
    <div class="stat-row stat-clickable" onclick="showDashDetail('unfinished')"><span>تسک‌های انجام نشده</span><span class="stat-val stat-urgent">${unfinishedTasks.length}</span></div>
    <div class="stat-row stat-clickable" onclick="showDashDetail('Saeed')"><span>تسک‌های سعید (انجام شده / کل)</span><span class="stat-val stat-saeed">${sDone} / ${sTasks.length}</span></div>
    <div class="stat-row stat-clickable" onclick="showDashDetail('Mohammadreza')"><span>تسک‌های محمدرضا (انجام شده / کل)</span><span class="stat-val stat-mohammadreza">${mDone} / ${mTasks.length}</span></div>`;
}

function showDashDetail(type) {
  const container = document.getElementById("dashDetailContainer"); const titleEl = document.getElementById("dashDetailTitle"); const listEl = document.getElementById("dashDetailList");
  if (container.style.display === "block" && container.getAttribute('data-type') === type) { container.style.display = "none"; return; }
  const weekDates = getWeekRange(); let filtered = tasks.filter(t => weekDates.includes(t.date));
  if (type === 'unfinished') { filtered = filtered.filter(t => !t.done); titleEl.textContent = "لیست تسک‌های انجام نشده این هفته"; }
  else { filtered = filtered.filter(t => t.user === type); const name = type === 'Saeed' ? 'سعید' : 'محمدرضا'; titleEl.textContent = `لیست تسک‌های ${name} این هفته`; }
  container.setAttribute('data-type', type);
  if (filtered.length === 0) { listEl.innerHTML = '<p style="color:#666; font-size:0.85rem;">تسکی یافت نشد</p>'; }
  else { listEl.innerHTML = ""; filtered.forEach(task => { const card = document.createElement("div"); const userClass = task.user === 'Saeed' ? 'user-saeed' : 'user-mohammadreza'; card.className = `task-card ${userClass} ${task.done ? "done" : ""}`; card.style.cursor = "default"; card.innerHTML = `${task.urgent ? '<span class="urgent-badge">فوری</span>' : ''}<div class="task-info"><b>${task.title}</b><small>${task.desc || ''}</small></div>`; listEl.appendChild(card); }); }
  container.style.display = "block";
}

// ============================
// بستن کارت تسک با ضربدر
// ============================
function closeTaskCard(id, event) {
  if (event) event.stopPropagation();
  expandedTaskIds.delete(id);
  const card = document.querySelector(`.task-card[data-task-id="${id}"]`);
  if (card) card.classList.remove("expanded");
}

// ============================
// مودال لیدها
// ============================
function openLeadModal(id) {
  const lead = leads.find(l => l.id === id);
  if (!lead) return;
  
  let notesArr = lead.notes || [];
  if (lead.desc && notesArr.length === 0) {
    notesArr = [{ text: lead.desc, time: 'تاریخ نامشخص' }];
  }
  
  let timelineHTML = '<div class="lead-timeline">';
  notesArr.slice().reverse().forEach(note => {
    timelineHTML += `
      <div class="lead-note">
        <span class="lead-note-time">${note.time}</span>
        <div class="lead-note-text">${note.text}</div>
      </div>
    `;
  });
  timelineHTML += '</div>';

  const modal = document.getElementById('leadModal');
  modal.querySelector('.modal-content').innerHTML = `
    <button class="modal-close" onclick="closeLeadModal()">✕</button>
    <div class="modal-header">
      <div>
        <b>${lead.name}</b><br>
        <span class="lead-phone-badge">${lead.phone}</span>
      </div>
      <a href="tel:${lead.phone}" class="btn-call">تماس</a>
    </div>
    ${timelineHTML}
    <div class="lead-actions" style="margin-top: 16px;">
      <button onclick="editLeadInfo(${lead.id}); closeLeadModal();">ویرایش</button>
      <button onclick="addLeadNote(${lead.id}); closeLeadModal();">یادداشت</button>
      <button class="btn-del-lead" onclick="deleteLead(${lead.id}); closeLeadModal();">حذف</button>
    </div>
  `;
  modal.style.display = 'flex';
}

function closeLeadModal() {
  document.getElementById('leadModal').style.display = 'none';
}

// ============================
// مقداردهی اولیه
// ============================
checkSession();