package dashboardmodel

import (
	"time"

	"github.com/google/uuid"
)

type DashboardStats struct {
	TotalProjects   int64 `json:"total_projects"`
	TotalTasks      int64 `json:"total_tasks"`
	TasksCompleted  int64 `json:"tasks_completed"`
	TasksInProgress int64 `json:"tasks_in_progress"`
	TasksTodo       int64 `json:"tasks_todo"`
	TotalUsers      int64 `json:"total_users"`
	ActiveProjects  int64 `json:"active_projects"`
	OverdueTasks    int64 `json:"overdue_tasks"`
}

type ProjectSummary struct {
	ID             uuid.UUID `json:"id"`
	Name           string    `json:"name"`
	Description    string    `json:"description"`
	ManagerName    string    `json:"manager_name"`
	TotalTasks     int64     `json:"total_tasks"`
	CompletedTasks int64     `json:"completed_tasks"`
	Progress       float64   `json:"progress"`
	CreatedAt      time.Time `json:"created_at"`
}

type TaskSummary struct {
	ID           uuid.UUID  `json:"id"`
	Title        string     `json:"title"`
	ProjectName  string     `json:"project_name"`
	Status       string     `json:"status"`
	AssigneeName *string    `json:"assignee_name"`
	DueDate      *time.Time `json:"due_date"`
	IsOverdue    bool       `json:"is_overdue"`
	CreatedAt    time.Time  `json:"created_at"`
}

type RecentActivity struct {
	ID         uuid.UUID `json:"id"`
	Type       string    `json:"type"`
	UserID     uuid.UUID `json:"user_id"`
	UserName   string    `json:"user_name"`
	Message    string    `json:"message"`
	TargetID   uuid.UUID `json:"target_id"`
	TargetType string    `json:"target_type"`
	CreatedAt  time.Time `json:"created_at"`
}

type UserSummary struct {
	ID             uuid.UUID `json:"id"`
	Username       string    `json:"username"`
	Email          string    `json:"email"`
	Role           string    `json:"role"`
	TotalTasks     int64     `json:"total_tasks"`
	CompletedTasks int64     `json:"completed_tasks"`
	JoinedAt       time.Time `json:"joined_at"`
}

type DashboardResponse struct {
	Stats          DashboardStats   `json:"stats"`
	RecentProjects []ProjectSummary `json:"recent_projects"`
	RecentTasks    []TaskSummary    `json:"recent_tasks"`
	MyTasks        []TaskSummary    `json:"my_tasks"`
	RecentActivity []RecentActivity `json:"recent_activity"`
}

type FilterRequest struct {
	DateRange string    `json:"date_range"`
	StartDate time.Time `json:"start_date"`
	EndDate   time.Time `json:"end_date"`
	ProjectID uuid.UUID `json:"project_id"`
	Status    string    `json:"status"`
	UserID    uuid.UUID `json:"user_id"`
}
