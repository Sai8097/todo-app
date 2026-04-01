let currentToken = localStorage.getItem('token') || null;
let currentRole = localStorage.getItem('role') || null;

const API_URL = '/api';

function init() {
    if (currentToken) {
        showDashboard();
    } else {
        showLogin();
    }
}

async function login() {
    const userInp = document.getElementById('username').value;
    const errorDiv = document.getElementById('login-error');
    errorDiv.innerText = '';
    
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: userInp })
        });
        const data = await res.json();
        if (data.success) {
            currentToken = data.token;
            currentRole = data.role;
            localStorage.setItem('token', currentToken);
            localStorage.setItem('role', currentRole);
            showDashboard();
        } else {
            errorDiv.innerText = data.message || 'Access Denied: Invalid User';
        }
    } catch(err) {
        errorDiv.innerText = 'System Node Disconnected (Network Error)';
    }
}

function logout() {
    currentToken = null;
    currentRole = null;
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    showLogin();
}

function showLogin() {
    document.getElementById('login-view').classList.remove('hidden');
    document.getElementById('dashboard-view').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('login-view').classList.add('hidden');
    document.getElementById('dashboard-view').classList.remove('hidden');
    
    document.getElementById('role-badge').innerText = currentRole.toUpperCase();
    
    document.getElementById('new-date').valueAsDate = new Date();
    loadTasks();
}

function toggleModal(id) {
    const el = document.getElementById(id);
    if (el.classList.contains('hidden')) {
        el.classList.remove('hidden');
        document.getElementById('new-title').focus();
    } else {
        el.classList.add('hidden');
    }
}

async function loadTasks() {
    try {
        const res = await fetch(`${API_URL}/tasks`, {
            headers: { 'Authorization': currentToken }
        });
        if (res.status === 401) { logout(); return; }
        const tasks = await res.json();
        renderTimeline(tasks);
    } catch(e) {
        console.error("Failed to sync pulse stream", e);
    }
}

function formatDate(ds) {
    if(!ds || ds === 'No Date') return 'Unscheduled';
    const d = new Date(ds);
    if(isNaN(d.getTime())) return ds;
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function renderTimeline(tasks) {
    const container = document.getElementById('tasks-container');
    container.innerHTML = '';
    
    const grouped = {};
    tasks.forEach(task => {
        const d = task.due_date || 'No Date';
        if(!grouped[d]) grouped[d] = [];
        grouped[d].push(task);
    });
    
    const dates = Object.keys(grouped).sort();
    
    dates.forEach(date => {
        const dsArr = grouped[date];
        
        const col = document.createElement('div');
        col.className = 'day-column';
        
        const header = document.createElement('div');
        header.className = 'day-header';
        header.innerHTML = `<span>${formatDate(date)}</span> <span class="task-count">${dsArr.length}</span>`;
        col.appendChild(header);
        
        const tasksContainer = document.createElement('div');
        tasksContainer.className = 'day-tasks';
        
        dsArr.forEach(task => {
            const card = document.createElement('div');
            card.className = `pulse-card ${task.priority.toLowerCase()} ${task.status === 'done' ? 'done' : ''}`;
            
            const titleText = currentRole === 'admin' ? `[${task.user_id}] ${task.title}` : task.title;
            
            card.innerHTML = `
                <div class="task-title">${titleText}</div>
                <div class="task-meta">
                    <span>${task.priority} Priority</span>
                    ${task.status === 'done' && task.completion_time ? `<span>✓ ${task.completion_time.split(' ')[0]}</span>` : ''}
                </div>
                <div class="actions-hover">
                    ${task.status !== 'done' ? `<button class="btn-icon check" onclick="updateTaskStatus('${task.id}', 'done', event)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg></button>` : ''}
                    <button class="btn-icon trash" onclick="deleteTask('${task.id}', event)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                </div>
            `;
            tasksContainer.appendChild(card);
        });
        
        col.appendChild(tasksContainer);
        container.appendChild(col);
    });
}

async function addTask() {
    const title = document.getElementById('new-title').value;
    const date = document.getElementById('new-date').value;
    const priority = document.getElementById('new-priority').value;
    
    if(!title.trim()) return;
    
    await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': currentToken },
        body: JSON.stringify({ title, due_date: date, priority })
    });
    
    document.getElementById('new-title').value = '';
    toggleModal('add-task-modal');
    loadTasks();
}

async function updateTaskStatus(id, status, e) {
    if(e) e.stopPropagation();
    await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': currentToken },
        body: JSON.stringify({ status })
    });
    loadTasks();
}

async function deleteTask(id, e) {
    if(e) e.stopPropagation();
    await fetch(`${API_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': currentToken }
    });
    loadTasks();
}

init();
