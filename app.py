from flask import Flask, request, jsonify, send_from_directory
from storage import load_tasks, save_tasks
from tasks import Task
from datetime import datetime
import os

app = Flask(__name__, static_url_path='', static_folder='static')

USERS = {
    "admin": {"role": "admin"},
    "user1": {"role": "user"},
    "user2": {"role": "user"}
}

@app.route('/')
def serve_index():
    return app.send_static_file('index.html')

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get("username")
    if username in USERS:
        return jsonify({"success": True, "token": username, "role": USERS[username]["role"]})
    return jsonify({"success": False, "message": "Invalid user"}), 401

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    token = request.headers.get("Authorization")
    if not token or token not in USERS:
        return jsonify({"error": "Unauthorized"}), 401
    
    tasks = load_tasks()
    role = USERS[token]["role"]
    
    if role == "admin":
        return jsonify([t.to_dict() for t in tasks])
    else:
        return jsonify([t.to_dict() for t in tasks if t.user_id == token])

@app.route('/api/tasks', methods=['POST'])
def add_task():
    token = request.headers.get("Authorization")
    if not token or token not in USERS:
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    tasks = load_tasks()
    
    # If admin creates a task, we either assign
    # default user_id or allow specifying
    user_id = data.get("user_id", token) if USERS[token]["role"] == "admin" else token

    new_task = Task(
        title=data.get("title", "Untitled"),
        description=data.get("description", ""),
        status=data.get("status", "pending"),
        user_id=user_id,
        due_date=data.get("due_date"),
        priority=data.get("priority", "Medium")
    )
    
    tasks.append(new_task)
    save_tasks(tasks)
    return jsonify(new_task.to_dict()), 201

@app.route('/api/tasks/<task_id>', methods=['PUT'])
def update_task(task_id):
    token = request.headers.get("Authorization")
    if not token or token not in USERS:
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.json
    tasks = load_tasks()
    role = USERS[token]["role"]
    
    for task in tasks:
        if task.id == task_id:
            if role != "admin" and task.user_id != token:
                return jsonify({"error": "Forbidden"}), 403
            
            # Update fields
            if "title" in data: task.title = data["title"]
            if "description" in data: task.description = data["description"]
            if "due_date" in data: task.due_date = data["due_date"]
            if "priority" in data: task.priority = data["priority"]
            if "status" in data:
                task.status = data["status"]
                if task.status == "done" and not task.completion_time:
                    task.completion_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                elif task.status != "done":
                    task.completion_time = None
                    
            save_tasks(tasks)
            return jsonify(task.to_dict())
            
    return jsonify({"error": "Task not found"}), 404

@app.route('/api/tasks/<task_id>', methods=['DELETE'])
def delete_task(task_id):
    token = request.headers.get("Authorization")
    if not token or token not in USERS:
        return jsonify({"error": "Unauthorized"}), 401
        
    tasks = load_tasks()
    role = USERS[token]["role"]
    
    for i, task in enumerate(tasks):
        if task.id == task_id:
            if role != "admin" and task.user_id != token:
                return jsonify({"error": "Forbidden"}), 403
            tasks.pop(i)
            save_tasks(tasks)
            return jsonify({"success": True})
            
    return jsonify({"error": "Task not found"}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5000)
