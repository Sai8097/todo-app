let currentToken = localStorage.getItem('token') || null;
let currentRole = localStorage.getItem('role') || null;
const API_URL = '/api';

let allTasks = [];
let currentFilter = 'all';

// Initialize
function init() {
  if (currentToken) {
    showDashboard();
  } else {
    showLogin();
  }
}

// ==========================
// AUTHENTICATION
// ==========================
async function login() {
  const userInp = document.getElementById('inp-username').value;
  const passInp = document.getElementById('inp-password').value;
  const errorDiv = document.getElementById('login-error');
  
  const btnText = document.getElementById('btn-login-text');
  const btnSpin = document.getElementById('btn-login-spin');

  if (!userInp || !passInp) {
    errorDiv.innerText = "Please enter both username and password.";
    errorDiv.classList.remove('hidden');
    return;
  }

  errorDiv.classList.add('hidden');
  btnText.classList.add('hidden');
  btnSpin.classList.remove('hidden');
  document.getElementById('btn-login').disabled = true;

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: userInp, password: passInp })
    });
    const data = await res.json();

    if (data.success) {
      currentToken = data.token;
      currentRole = data.role;
      localStorage.setItem('token', currentToken);
      localStorage.setItem('role', currentRole);
      
      // Clear inputs
      document.getElementById('inp-username').value = '';
      document.getElementById('inp-password').value = '';
      
      showDashboard();
    } else {
      errorDiv.innerText = data.message;
      errorDiv.classList.remove('hidden');
    }
  } catch (err) {
    errorDiv.innerText = "Server error. Is the backend running?";
    errorDiv.classList.remove('hidden');
  } finally {
    btnText.classList.remove('hidden');
    btnSpin.classList.add('hidden');
    document.getElementById('btn-login').disabled = false;
  }
}

function logout() {
  localStorage.clear();
  currentToken = null;
  currentRole = null;
  showLogin();
  allTasks = [];
}

function togglePw() {
  const inp = document.getElementById('inp-password');
  const btn = document.getElementById('pw-eye');
  if (inp.type === 'password') {
    inp.type = 'text';
    btn.innerText = '⊘';
  } else {
    inp.type = 'password';
    btn.innerText = '👁';
  }
}

// ==========================
// VIEWS & UI
// ==========================
function showLogin() {
  document.getElementById('page-login').classList.remove('hidden');
  document.getElementById('page-dashboard').classList.add('hidden');
}

function showDashboard() {
  document.getElementById('page-login').classList.add('hidden');
  document.getElementById('page-dashboard').classList.remove('hidden');
  document.getElementById('badge-user').innerText = currentToken;
  document.getElementById('badge-role').innerText = currentRole.toUpperCase();

  const filterUserSelect = document.getElementById('filter-user');
  const assignGroup = document.getElementById('assign-group');
  const usersCard = document.getElementById('stat-users-card');

  if (currentRole === 'admin') {
    filterUserSelect.classList.remove('hidden');
    assignGroup.classList.remove('hidden');
    usersCard.style.display = 'block';
    loadUsers();
  } else {
    filterUserSelect.classList.add('hidden');
    assignGroup.classList.add('hidden');
    usersCard.style.display = 'none';
  }

  loadTasks();
}

function setFilter(flt) {
  currentFilter = flt;
  document.querySelectorAll('.filter-tabs .tab').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-${flt}`).classList.add('active');
  renderTasks();
}

// ==========================
// DATA FETCHING
// ==========================
async function loadUsers() {
  try {
    const res = await fetch(`${API_URL}/users`, { headers: { 'Authorization': currentToken } });
    if (res.ok) {
      const users = await res.json();
      document.getElementById('stat-users').innerText = users.length;
      
      const filterSelect = document.getElementById('filter-user');
      const assignSelect = document.getElementById('inp-assign');
      
      // Keep first option
      filterSelect.innerHTML = '<option value="">All Users</option>';
      assignSelect.innerHTML = '<option value="">— Assign to myself (admin) —</option>';

      users.forEach(u => {
        filterSelect.innerHTML += `<option value="${u.username}">${u.username}</option>`;
        assignSelect.innerHTML += `<option value="${u.username}">${u.username}</option>`;
      });
    }
  } catch (err) { console.error(err); }
}

async function loadTasks() {
  try {
    const res = await fetch(`${API_URL}/tasks`, { headers: { 'Authorization': currentToken } });
    if (res.status === 401) return logout();
    if (res.ok) {
      allTasks = await res.json();
      // sort by created date desc
      allTasks.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
      renderTasks();
    }
  } catch (err) { console.error(err); }
}

// ==========================
// RENDER TASKS
// ==========================
function renderTasks() {
  const container = document.getElementById('task-list');
  const filterUser = document.getElementById('filter-user').value;
  
  let filtered = allTasks;

  if (filterUser) {
    filtered = filtered.filter(t => t.user_id === filterUser);
  }

  const statTotal = filtered.length;
  const statDone = filtered.filter(t => t.status === 'done').length;
  const statPend = statTotal - statDone;

  document.getElementById('stat-total').innerText = statTotal;
  document.getElementById('stat-done').innerText = statDone;
  document.getElementById('stat-pending').innerText = statPend;

  if (currentFilter === 'pending') {
    filtered = filtered.filter(t => t.status !== 'done');
  } else if (currentFilter === 'done') {
    filtered = filtered.filter(t => t.status === 'done');
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <p>No tasks found in this view.</p>
      </div>`;
    return;
  }

  container.innerHTML = '';
  filtered.forEach(task => {
    container.appendChild(createTaskCard(task));
  });
}

function createTaskCard(task) {
  const isDone = task.status === 'done';
  const div = document.createElement('div');
  div.className = `task-card ${isDone ? 'is-done' : ''}`;

  const checkIcon = isDone ? '✓' : '';
  const priorClass = task.priority.toLowerCase();
  
  let userBadge = '';
  if (currentRole === 'admin') {
    userBadge = `<span class="user-label">@${task.user_id}</span>`;
  }

  div.innerHTML = `
    <button class="check-btn" onclick="toggleTaskStatus('${task.id}', '${task.status}')" title="${isDone ? 'Mark Pending' : 'Mark Complete'}">
      ${checkIcon}
    </button>
    <div class="task-content">
      <div class="task-header">
        <div class="task-title">${task.title}</div>
        <div class="task-actions">
          <button class="btn-icon" onclick="openEditModal('${task.id}')" title="Edit">✎</button>
          <button class="btn-icon del" onclick="deleteTask('${task.id}')" title="Delete">🗑</button>
        </div>
      </div>
      ${task.description ? `<div class="task-desc">${task.description}</div>` : ''}
      <div class="task-meta">
        ${userBadge}
        <span class="badge ${priorClass}">${task.priority}</span>
        ${task.due_date ? `<span class="date-badge">📅 ${task.due_date}</span>` : ''}
      </div>
    </div>
  `;
  return div;
}

// ==========================
// MODALS & CRUD
// ==========================
function openAddModal() {
  document.getElementById('modal-title').innerText = "Add Task";
  document.getElementById('edit-task-id').value = '';
  document.getElementById('inp-title').value = '';
  document.getElementById('inp-desc').value = '';
  document.getElementById('inp-priority').value = 'Medium';
  document.getElementById('inp-due').value = '';
  if (currentRole === 'admin') {
    document.getElementById('inp-assign').value = document.getElementById('filter-user').value || '';
  }
  document.getElementById('modal-error').classList.add('hidden');
  document.getElementById('modal-task').classList.remove('hidden');
  document.getElementById('inp-title').focus();
}

function openEditModal(taskId) {
  const task = allTasks.find(t => t.id === taskId);
  if(!task) return;

  document.getElementById('modal-title').innerText = "Edit Task";
  document.getElementById('edit-task-id').value = task.id;
  document.getElementById('inp-title').value = task.title;
  document.getElementById('inp-desc').value = task.description;
  document.getElementById('inp-priority').value = task.priority;
  document.getElementById('inp-due').value = task.due_date;
  
  if (currentRole === 'admin') {
    // Cannot reassign safely after creation but let's let admin edit assignment
    document.getElementById('inp-assign').value = task.user_id !== currentToken ? task.user_id : '';
  }

  document.getElementById('modal-error').classList.add('hidden');
  document.getElementById('modal-task').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-task').classList.add('hidden');
}

function closeModalOnBg(e) {
  if (e.target.id === 'modal-task') closeModal();
}

async function saveTask() {
  const editId = document.getElementById('edit-task-id').value;
  const title = document.getElementById('inp-title').value;
  const desc = document.getElementById('inp-desc').value;
  const prio = document.getElementById('inp-priority').value;
  const due = document.getElementById('inp-due').value;
  let userId = undefined;
  
  if (currentRole === 'admin') {
    userId = document.getElementById('inp-assign').value;
  }

  if (!title) {
    document.getElementById('modal-error').innerText = "Title is required";
    document.getElementById('modal-error').classList.remove('hidden');
    return;
  }

  const payload = { title, description: desc, priority: prio, due_date: due };
  if (userId) payload.user_id = userId;

  const url = editId ? `${API_URL}/tasks/${editId}` : `${API_URL}/tasks`;
  const method = editId ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': currentToken },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      closeModal();
      loadTasks();
    } else {
      const data = await res.json();
      document.getElementById('modal-error').innerText = data.error || "Operation failed";
      document.getElementById('modal-error').classList.remove('hidden');
    }
  } catch(err) { console.error(err); }
}

async function toggleTaskStatus(taskId, currentStatus) {
  const newStatus = currentStatus === 'done' ? 'pending' : 'done';
  try {
    await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': currentToken },
      body: JSON.stringify({ status: newStatus })
    });
    loadTasks();
  } catch(err) { console.error(err); }
}

async function deleteTask(taskId) {
  if (!confirm("Are you sure you want to delete this task?")) return;
  try {
    await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { 'Authorization': currentToken }
    });
    loadTasks();
  } catch(err) { console.error(err); }
}

// Stats user detail (admin)
function showAdminUserData(username) {
  // Optional expansion if Admin clicks user count. Currently handled by filter dropdown.
}

document.getElementById('stat-users-card').addEventListener('click', () => {
    // Just a nice flourish if clicked
    document.getElementById('filter-user').focus();
});