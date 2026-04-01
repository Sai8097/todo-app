import uuid
from datetime import datetime

class Task:
    def __init__(self, title, description="", status="pending", user_id="user1", due_date=None, priority="Medium", task_id=None, completion_time=None, created_at=None):
        self.id = task_id or str(uuid.uuid4())
        self.user_id = user_id
        self.title = title
        self.description = description
        self.status = status
        self.due_date = due_date or datetime.now().strftime("%Y-%m-%d")
        self.priority = priority
        self.completion_time = completion_time
        self.created_at = created_at or datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "due_date": self.due_date,
            "priority": self.priority,
            "completion_time": self.completion_time,
            "created_at": self.created_at
        }

    @staticmethod
    def from_dict(data):
        return Task(
            title=data.get("title", "Untitled"),
            description=data.get("description", ""),
            status=data.get("status", "pending"),
            user_id=data.get("user_id", "user1"),
            due_date=data.get("due_date", datetime.now().strftime("%Y-%m-%d")),
            priority=data.get("priority", "Medium"),
            task_id=data.get("id"),
            completion_time=data.get("completion_time"),
            created_at=data.get("created_at")
        )