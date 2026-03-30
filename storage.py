import json
from tasks import Task

FILE = "data.json"

def load_tasks():
    try:
        with open(FILE, "r") as f:
            data = json.load(f)
            return [Task.from_dict(t) for t in data]
    except (FileNotFoundError, json.JSONDecodeError):
        return []

def save_tasks(tasks):
    with open(FILE, "w") as f:
        json.dump([t.to_dict() for t in tasks], f, indent=4)