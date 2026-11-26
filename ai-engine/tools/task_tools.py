from langchain.tools import tool
import requests
from datetime import date


API_URL = "http://localhost:3000/tasks"


# 1. Get Tasks
@tool
def get_tasks(project_id: int):
    """Get all tasks belonging to a specific project."""

    response = requests.get(
        f"{API_URL}/{project_id}",
        timeout=15
    )

    response.raise_for_status()

    return response.json()["tasks"]


# 2. Create Task
@tool 
def create_task(
    title: str,
    project_id: int,
    description: str = "",
    state: str = "to-do",
    priority: str = "medium",
    date_end: str = ""
):
    """Create a new task inside a specific project."""

    payload = {
        "title": title,
        "description": description,
        "state": state,
        "Priority": priority,
        "date_end": date_end or None,
        "project_id": project_id
    }

    response = requests.post(
        API_URL,
        json=payload,
        timeout=15
    )

    response.raise_for_status()

    return response.json()["tasks"]


# 3. Change Task Status
@tool
def change_task_status(task_id: int, state: str):
    """Change the status of an existing task."""

    payload = {
        "state": state
    }

    response = requests.patch(
        f"{API_URL}/{task_id}",
        json=payload,
        timeout=15
    )

    response.raise_for_status()

    return response.json()["task"]


# 4. Get Overdue Tasks
@tool
def get_overdue_tasks(project_id: int):
    """Get tasks that have passed their due date and are not completed."""

    tasks = get_tasks.invoke({
        "project_id": project_id
    })

    today = date.today()

    overdue = []

    for task in tasks:

        due_date = task.get("date_end")

        if not due_date:
            continue

        if task.get("state") == "complete":
            continue

        due = date.fromisoformat(due_date[:10])

        if due < today:
            overdue.append(task)

    return overdue


# 5. Analyze Tasks
@tool
def analyze_tasks(project_id: int):
    """Analyze task progress and return project task statistics."""

    tasks = get_tasks.invoke({
        "project_id": project_id
    })

    total = len(tasks)

    completed = sum(
        1 for task in tasks
        if task.get("state") == "complete"
    )

    in_progress = sum(
        1 for task in tasks
        if task.get("state") == "in-progress"
    )

    todo = sum(
        1 for task in tasks
        if task.get("state") == "to-do"
    )

    overdue = len(get_overdue_tasks.invoke({
        "project_id": project_id
    }))

    progress = (
        round((completed / total) * 100, 2)
        if total else 0
    )
    return {
        "total_tasks": total,
        "completed": completed,
        "in_progress": in_progress,
        "to_do": todo,
        "overdue": overdue,
        "progress_percentage": progress
    }

# 6. Find Project By Name
@tool
def find_project_by_name(project_name: str):
    """Find a project by its name and return its internal ID."""

    response = requests.get(
        "http://localhost:3000/projects",
        timeout=15
    )

    response.raise_for_status()

    projects = response.json()["projects"]

    search_name = project_name.strip().casefold()

    # البحث عن تطابق كامل أولاً
    exact_matches = [
        project for project in projects
        if project["name"].strip().casefold() == search_name
    ]

    if len(exact_matches) == 1:
        return exact_matches[0]

    if len(exact_matches) > 1:
        return {
            "error": "Multiple projects have the same name",
            "matches": exact_matches
        }

    # البحث الجزئي إذا لم يوجد تطابق كامل
    partial_matches = [
        project for project in projects
        if search_name in project["name"].strip().casefold()
    ]

    if len(partial_matches) == 1:
        return partial_matches[0]

    if len(partial_matches) > 1:
        return {
            "error": "Project name is ambiguous",
            "matches": partial_matches
        }

    return {
        "error": f"Project '{project_name}' not found"
    }
    

