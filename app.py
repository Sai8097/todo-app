from flask import Flask, request, jsonify
from datetime import datetime
import json
import os
import uuid

app = Flask(__name__, static_url_path='', static_folder='static')

# --- User store (username: {password, role}) ---
USERS = {
    "admin":  {"password": "admin123", "role": "admin"},
    "alice":  {"password": "alice123", "role": "user"},
    "bob":    {"password": "bob123",   "role": "user"},
    "charlie": {"password": "charlie123", "role": "user"},
}

DATA_FILE = "data.json"


def load_tasks():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, "r") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []


def save_tasks(tasks):
    with open(DATA_FILE, "w") as f:
        json.dump(tasks, f, indent=2)


def get_user(token):
    return USERS.get(token)


# ── Serve Frontend ─────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return app.send_static_file("index.html")


# ── Auth ───────────────────────────────────────────────────────────────────────
@app.route("/api/login", methods=["POST"])
def login():
    body = request.json or {}
    username = body.get("username", "").strip()
    password = body.get("password", "")

    user = USERS.get(username)
    if not user or user["password"] != password:
        return jsonify({"success": False, "message": "Invalid username or password"}), 401

    return jsonify({"success": True, "token": username, "role": user["role"]})


# ── Users list (admin only) ────────────────────────────────────────────────────
@app.route("/api/users", methods=["GET"])
def list_users():
    token = request.headers.get("Authorization", "")
    user = get_user(token)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    if user["role"] != "admin":
        return jsonify({"error": "Forbidden"}), 403

    users = [
        {"username": u, "role": info["role"]}
        for u, info in USERS.items()
        if info["role"] != "admin"
    ]
    return jsonify(users)


# ── Tasks ──────────────────────────────────────────────────────────────────────
@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    token = request.headers.get("Authorization", "")
    user = get_user(token)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    tasks = load_tasks()

    if user["role"] == "admin":
        return jsonify(tasks)
    else:
        return jsonify([t for t in tasks if t["user_id"] == token])


@app.route("/api/tasks", methods=["POST"])
def add_task():
    token = request.headers.get("Authorization", "")
    user = get_user(token)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    body = request.json or {}
    title = body.get("title", "").strip()
    if not title:
        return jsonify({"error": "Title is required"}), 400

    # Admin may assign task to any user; regular user always assigns to self
    if user["role"] == "admin":
        user_id = body.get("user_id", token)
    else:
        user_id = token

    task = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": title,
        "description": body.get("description", ""),
        "priority": body.get("priority", "Medium"),
        "status": "pending",
        "due_date": body.get("due_date", datetime.now().strftime("%Y-%m-%d")),
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "completed_at": None,
    }

    tasks = load_tasks()
    tasks.append(task)
    save_tasks(tasks)
    return jsonify(task), 201


@app.route("/api/tasks/<task_id>", methods=["PUT"])
def update_task(task_id):
    token = request.headers.get("Authorization", "")
    user = get_user(token)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    body = request.json or {}
    tasks = load_tasks()

    for task in tasks:
        if task["id"] == task_id:
            if user["role"] != "admin" and task["user_id"] != token:
                return jsonify({"error": "Forbidden"}), 403

            if "title" in body:
                task["title"] = body["title"]
            if "description" in body:
                task["description"] = body["description"]
            if "priority" in body:
                task["priority"] = body["priority"]
            if "due_date" in body:
                task["due_date"] = body["due_date"]
            if "status" in body:
                new_status = body["status"]
                task["status"] = new_status
                if new_status == "done":
                    task["completed_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                else:
                    task["completed_at"] = None

            save_tasks(tasks)
            return jsonify(task)

    return jsonify({"error": "Task not found"}), 404


@app.route("/api/tasks/<task_id>", methods=["DELETE"])
def delete_task(task_id):
    token = request.headers.get("Authorization", "")
    user = get_user(token)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    tasks = load_tasks()
    for i, task in enumerate(tasks):
        if task["id"] == task_id:
            if user["role"] != "admin" and task["user_id"] != token:
                return jsonify({"error": "Forbidden"}), 403
            tasks.pop(i)
            save_tasks(tasks)
            return jsonify({"success": True})

    return jsonify({"error": "Task not found"}), 404


if __name__ == "__main__":
    app.run(debug=True, port=5000)
