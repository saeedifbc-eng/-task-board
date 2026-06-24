let tasks = [];

loadTasks();
renderTasks();

function addTask() {
  const title = document.getElementById("title").value;
  const desc = document.getElementById("desc").value;
  const user = document.getElementById("user").value;
  const day = document.getElementById("day").value;

  tasks.push({
    id: Date.now(),
    title,
    desc,
    user,
    day,
    done: false
  });

  saveTasks();
  renderTasks();
}

function renderTasks() {
  const list = document.getElementById("taskList");
  list.innerHTML = "";

  const userFilter = document.getElementById("filterUser").value;
  const dayFilter = document.getElementById("filterDay").value;

  tasks.forEach(task => {

    if (userFilter !== "All" && task.user !== userFilter) return;
    if (dayFilter !== "All" && task.day !== dayFilter) return;

    list.innerHTML += `
      <div class="card ${task.done ? "done" : ""}">

        <b>${task.title}</b><br>
        <small>${task.user} | ${task.day}</small>

        <p>${task.desc}</p>

        <button onclick="toggleDone(${task.id})">
          ${task.done ? "Not Done" : "Done"}
        </button>

        <button onclick="editTask(${task.id})">Edit</button>

        <button onclick="deleteTask(${task.id})">Delete</button>

      </div>
    `;
  });
}

function toggleDone(id) {
  tasks = tasks.map(t => {
    if (t.id === id) return { ...t, done: !t.done };
    return t;
  });

  saveTasks();
  renderTasks();
}

function editTask(id) {
  const task = tasks.find(t => t.id === id);

  const newTitle = prompt("New title", task.title);
  const newDesc = prompt("New description", task.desc);

  tasks = tasks.map(t => {
    if (t.id === id) {
      return { ...t, title: newTitle, desc: newDesc };
    }
    return t;
  });

  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);

  saveTasks();
  renderTasks();
}

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadTasks() {
  const data = localStorage.getItem("tasks");
  if (data) tasks = JSON.parse(data);
}