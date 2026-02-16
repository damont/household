PRESETS: dict[str, list[dict]] = {
    "track": [
        {
            "name": "tasks",
            "path": "/api/tasks",
            "method": "GET",
            "dashboard_label": "Tasks",
        },
        {
            "name": "tasks_active",
            "path": "/api/tasks?active=true",
            "method": "GET",
            "dashboard_label": "Active Tasks",
        },
        {
            "name": "projects",
            "path": "/api/projects",
            "method": "GET",
            "dashboard_label": "Projects",
        },
    ],
    "calendar": [
        {
            "name": "current_week",
            "path": "/api/weeks/current",
            "method": "GET",
            "dashboard_label": "This Week",
        },
    ],
}


def get_preset_endpoints(service_type: str) -> list[dict] | None:
    return PRESETS.get(service_type)
