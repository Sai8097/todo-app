from tasks import Task
from storage import load_tasks, save_tasks
from utils import print_tasks

def main():
    tasks = load_tasks()

    while True:
        print("\n==== TODO MENU ====")
        print("1. Add Task")
        print("2. View Tasks")
        print("3. Mark Complete")
        print("4. Delete Task")
        print("5. Exit")

        choice = input("Choose: ")

        if choice == "1":
            title = input("Title: ")
            desc = input("Description: ")
            tasks.append(Task(title, desc))
            save_tasks(tasks)
            print("Task added!")

        elif choice == "2":
            print_tasks(tasks)

        elif choice == "3":
            print_tasks(tasks)
            idx = int(input("Task number: ")) - 1
            if 0 <= idx < len(tasks):
                tasks[idx].status = "done"
                save_tasks(tasks)
                print("Marked as complete!")

        elif choice == "4":
            print_tasks(tasks)
            idx = int(input("Task number: ")) - 1
            if 0 <= idx < len(tasks):
                tasks.pop(idx)
                save_tasks(tasks)
                print("Deleted!")

        elif choice == "5":
            break

        else:
            print("Invalid choice!")

if __name__ == "__main__":
    main()