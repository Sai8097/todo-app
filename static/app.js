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
            errorDiv.innerText = data.message || 'Login failed';
        }
    } catch(err) {
        errorDiv.innerText = 'Network error';
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
    document.getElementById('welcome-message').innerText = `Dashboard (${currentToken})`;
    
    // Set default date to today in YYYY-MM-DD format
    document.getElementById('new-date').valueAsDate = new Date();
    loadTasks();
}

async function loadTasks() {
    try {
        const res = await fetch(`${API_URL}/tasks`, {
            headers: { 'Authorization': currentToken }
        });
        if (res.status === 401) { logout(); return; }
        const tasks = await res.json();
        renderTasks(tasks);
    } catch(e) {
        console.error("Failed to load tasks", e);
    }
}

function renderTasks(tasks) {
    const container = document.getElementById('tasks-container');
    container.innerHTML = '';
    
    // Group by Date
    const grouped = {};
    tasks.forEach(task => {
        const d = task.due_date || 'No Date';
        if(!grouped[d]) grouped[d] = [];
        grouped[d].push(task);
    });
    
    // Sort dates
    const dates = Object.keys(grouped).sort();
    
    dates.forEach(date => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'date-group';
        
        const header = document.createElement('div');
        header.className = 'date-header';
        header.innerText = date;
        groupDiv.appendChild(header);
        
        grouped[date].forEach(task => {
            const card = document.createElement('div');
            card.className = `task-card ${task.priority.toLowerCase()} ${task.status === 'done' ? 'done' : ''}`;
            
            const info = document.createElement('div');
            info.className = 'task-info';
            
            const title = document.createElement('div');
            title.className = 'task-title';
            title.innerText = currentRole === 'admin' ? `[${task.user_id}] ${task.title}` : task.title;
            
            const meta = document.createElement('div');
            meta.className = 'task-meta';
            meta.innerHTML = `<span class="priority-badge">${task.priority}</span>`;
            if (task.status === 'done' && task.completion_time) {
                meta.innerHTML += `<span>Completed: ${task.completion_time}</span>`;
            }
            
            info.appendChild(title);
            info.appendChild(meta);
            
            const actions = document.createElement('div');
            actions.className = 'task-actions';
            
            if (task.status !== 'done') {
                const checkBtn = document.createElement('button');
                checkBtn.className = 'action-btn complete';
                checkBtn.innerHTML = '✓';
                checkBtn.onclick = () => updateTaskStatus(task.id, 'done');
                actions.appendChild(checkBtn);
            }
            
            const delBtn = document.createElement('button');
            delBtn.className = 'action-btn delete';
            delBtn.innerHTML = '✕';
            delBtn.onclick = () => deleteTask(task.id);
            actions.appendChild(delBtn);
            
            card.appendChild(info);
            card.appendChild(actions);
            groupDiv.appendChild(card);
        });
        container.appendChild(groupDiv);
    });
}

async function addTask() {
    const title = document.getElementById('new-title').value;
    const date = document.getElementById('new-date').value;
    const priority = document.getElementById('new-priority').value;
    
    if(!title.trim()) return;
    
    await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': currentToken
        },
        body: JSON.stringify({
            title: title,
            due_date: date,
            priority: priority
        })
    });
    
    document.getElementById('new-title').value = '';
    loadTasks();
}

async function updateTaskStatus(id, status) {
    await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': currentToken
        },
        body: JSON.stringify({ status: status })
    });
    loadTasks();
}

async function deleteTask(id) {
    await fetch(`${API_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': currentToken
        }
    });
    loadTasks();
}

init();
