from langchain.tools import tool
import requests


USERS_API    = "http://localhost:3000/users"
PROJECTS_API = "http://localhost:3000/projects"
TASKS_API    = "http://localhost:3000/tasks"


# ─── 1. جلب جميع المستخدمين ───────────────────────────────────────────────
@tool
def get_all_users() -> list:
    """Get all registered users in the system with their basic info."""

    response = requests.get(USERS_API, timeout=15)
    response.raise_for_status()

    return response.json()


# ─── 2. البحث عن مستخدم بالاسم ────────────────────────────────────────────
@tool
def find_user_by_name(username: str) -> dict:
    """Search for a user by username (supports partial match)."""

    response = requests.get(USERS_API, timeout=15)
    response.raise_for_status()

    users = response.json()
    search = username.strip().casefold()

    # تطابق كامل أولاً
    exact = [u for u in users if u["username"].strip().casefold() == search]
    if len(exact) == 1:
        return exact[0]
    if len(exact) > 1:
        return {"error": "Multiple users share this name", "matches": exact}

    # تطابق جزئي
    partial = [u for u in users if search in u["username"].strip().casefold()]
    if len(partial) == 1:
        return partial[0]
    if len(partial) > 1:
        return {"error": "Username is ambiguous", "matches": partial}

    return {"error": f"User '{username}' not found"}


# ─── 3. جلب أعضاء مشروع محدد ──────────────────────────────────────────────
@tool
def get_project_members(project_id: int) -> list:
    """Get all members who belong to a specific project."""

    response = requests.get(
        f"{PROJECTS_API}/{project_id}/members",
        timeout=15
    )
    response.raise_for_status()

    return response.json().get("members", [])


# ─── 4. تحليل عبء العمل لكل عضو ──────────────────────────────────────────
@tool
def analyze_workload(project_id: int) -> list:
    """
    Analyze workload for each member in a project.
    Returns a list of members sorted by task count (ascending = least busy first).
    """

    # جلب الأعضاء
    members_resp = requests.get(
        f"{PROJECTS_API}/{project_id}/members",
        timeout=15
    )
    members_resp.raise_for_status()
    members = members_resp.json().get("members", [])

    if not members:
        return []

    # جلب المهام
    tasks_resp = requests.get(f"{TASKS_API}/{project_id}", timeout=15)
    tasks_resp.raise_for_status()
    tasks = tasks_resp.json().get("tasks", [])

    # تهيئة العداد لكل عضو
    workload = {}
    for member in members:
        user = member.get("user", {}) or {}
        uid = user.get("id")
        if uid:
            workload[uid] = {
                "user_id":    uid,
                "username":   user.get("username", "Unknown"),
                "role":       user.get("role", ""),
                "total":      0,
                "todo":       0,
                "in_progress": 0,
                "complete":   0,
            }

    # جلب أعضاء كل مهمة وربطها بالمستخدمين
    for task in tasks:
        task_id = task.get("id")
        if not task_id:
            continue

        try:
            tm_resp = requests.get(
                f"{TASKS_API}/{task_id}/members",
                timeout=10
            )
            tm_resp.raise_for_status()
            task_members = tm_resp.json().get("members", [])
        except Exception:
            task_members = []

        state = task.get("state", "to-do")

        for tm in task_members:
            uid = tm.get("id")
            if uid in workload:
                workload[uid]["total"] += 1
                if state == "to-do":
                    workload[uid]["todo"] += 1
                elif state == "in-progress":
                    workload[uid]["in_progress"] += 1
                elif state == "complete":
                    workload[uid]["complete"] += 1

    result = sorted(workload.values(), key=lambda x: x["total"])
    return result


# ─── 5. مهام عضو معين في مشروع ────────────────────────────────────────────
@tool
def get_user_tasks_in_project(project_id: int, user_id: str) -> dict:
    """
    Get all tasks assigned to a specific user inside a project,
    grouped by status.
    """

    tasks_resp = requests.get(f"{TASKS_API}/{project_id}", timeout=15)
    tasks_resp.raise_for_status()
    tasks = tasks_resp.json().get("tasks", [])

    user_tasks = {"todo": [], "in_progress": [], "complete": []}

    for task in tasks:
        task_id = task.get("id")
        if not task_id:
            continue

        try:
            tm_resp = requests.get(
                f"{TASKS_API}/{task_id}/members",
                timeout=10
            )
            tm_resp.raise_for_status()
            task_members = tm_resp.json().get("members", [])
        except Exception:
            task_members = []

        member_ids = [str(m.get("id")) for m in task_members]

        if str(user_id) in member_ids:
            state = task.get("state", "to-do")
            entry = {
                "id":       task.get("id"),
                "title":    task.get("title"),
                "priority": task.get("Priority"),
                "date_end": task.get("date_end"),
                "state":    state,
            }
            if state == "to-do":
                user_tasks["todo"].append(entry)
            elif state == "in-progress":
                user_tasks["in_progress"].append(entry)
            elif state == "complete":
                user_tasks["complete"].append(entry)

    return user_tasks


# ─── 6. اقتراح أفضل عضو لاستلام مهمة ─────────────────────────────────────
@tool
def suggest_best_member(project_id: int) -> dict:
    """
    Suggest the most suitable (least busy) project member to assign a new task.
    Returns the member with the fewest active (non-complete) tasks.
    """

    workload = analyze_workload.invoke({"project_id": project_id})

    if not workload:
        return {"error": "No members found in this project"}

    # الأقل انشغالاً = أقل مهام غير مكتملة
    def active_tasks(m):
        return m["todo"] + m["in_progress"]

    best = min(workload, key=active_tasks)

    return {
        "suggestion":  best,
        "reason":      (
            f"{best['username']} has only {active_tasks(best)} active task(s) "
            f"({best['todo']} to-do, {best['in_progress']} in-progress)."
        ),
        "all_members": workload,
    }


# ─── 7. التحقق من عضوية مستخدم في مشروع ──────────────────────────────────
@tool
def verify_user_membership(project_id: int, user_id: str) -> dict:
    """
    Verify whether a specific user is a member of a given project.
    Must be called before suggesting task assignment to a user.
    """

    members_resp = requests.get(
        f"{PROJECTS_API}/{project_id}/members",
        timeout=15
    )
    members_resp.raise_for_status()
    members = members_resp.json().get("members", [])

    for member in members:
        user = member.get("user", {}) or {}
        if str(user.get("id")) == str(user_id):
            return {
                "is_member": True,
                "user":      user,
                "project_id": project_id,
            }

    return {
        "is_member":  False,
        "user_id":    user_id,
        "project_id": project_id,
        "message":    "User is not a member of this project.",
    }
