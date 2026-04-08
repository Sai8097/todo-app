const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

// Dummy users
const users = {
    admin: { role: 'admin' },
    user1: { role: 'user' },
    user2: { role: 'user' }
};

// Tasks data
let tasks = [
    { id: 1, title: "Learn JS", priority: "High" },
    { id: 2, title: "Build Project", priority: "Medium" }
];

// LOGIN API
app.post('/api/login', (req, res) => {
    const { username } = req.body;

    if (users[username]) {
        res.json({
            success: true,
            token: "dummy-token",
            role: users[username].role
        });
    } else {
        res.json({
            success: false,
            message: "Invalid username"
        });
    }
});

// GET TASKS
app.get('/api/tasks', (req, res) => {
    res.json(tasks);
});

// ADD TASK ✅
app.post('/api/tasks', (req, res) => {
    const { title, priority } = req.body;

    if (!title) {
        return res.json({ success: false, message: "Title required" });
    }

    const newTask = {
        id: tasks.length + 1,
        title,
        priority
    };

    tasks.push(newTask);

    res.json({
        success: true,
        task: newTask
    });
});

// START SERVER
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});