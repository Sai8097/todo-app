from datetime import datetime

class Task:
    def __init__(self, title, description="", status="pending"):
        self.title = title
        self.description = description
        self.status = status
        self.created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    def to_dict(self):
        return {
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "created_at": self.created_at
        }

    @staticmethod
    def from_dict(data):
        task = Task(data["title"], data["description"], data["status"])
        task.created_at = data["created_at"]
        return task