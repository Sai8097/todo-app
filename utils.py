def print_tasks(tasks):
    if not tasks:
        print("\nNo tasks found.\n")
        return

    print("\nYour Tasks:\n")
    for i, task in enumerate(tasks, start=1):
        print(f"{i}. {task.title} [{task.status}]")
        print(f"   {task.description}")
        print(f"   Created: {task.created_at}\n")