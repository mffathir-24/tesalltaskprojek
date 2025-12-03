package dashboardmodel

import (
	"time"

	"github.com/google/uuid"
)

// ==================== Admin Dashboard Models ====================

type AdminTaskStats struct {
	TotalTasks      int64 `json:"total_tasks"`
	TodoTasks       int64 `json:"todo_tasks"`
	InProgressTasks int64 `json:"in_progress_tasks"`
	DoneTasks       int64 `json:"done_tasks"`
	OverdueTasks    int64 `json:"overdue_tasks"`
}

type AdminProjectStats struct {
	TotalProjects     int64 `json:"total_projects"`
	ActiveProjects    int64 `json:"active_projects"`
	CompletedProjects int64 `json:"completed_projects"`
}

type AdminDashboardStats struct {
	ProjectStats AdminProjectStats `json:"project_stats"`
	TaskStats    AdminTaskStats    `json:"task_stats"`
	TotalUsers   int64             `json:"total_users"`
}

type AdminProjectDetail struct {
	ID              uuid.UUID `json:"id"`
	Name            string    `json:"name"`
	ManagerName     string    `json:"manager_name"`
	TotalTasks      int64     `json:"total_tasks"`
	TodoTasks       int64     `json:"todo_tasks"`
	InProgressTasks int64     `json:"in_progress_tasks"`
	DoneTasks       int64     `json:"done_tasks"`
	Progress        float64   `json:"progress"`
	CreatedAt       time.Time `json:"created_at"`
}

type AdminTaskDetail struct {
	ID           uuid.UUID  `json:"id"`
	Title        string     `json:"title"`
	ProjectName  string     `json:"project_name"`
	Status       string     `json:"status"`
	AssigneeName *string    `json:"assignee_name"`
	DueDate      *time.Time `json:"due_date"`
	IsOverdue    bool       `json:"is_overdue"`
	CreatedAt    time.Time  `json:"created_at"`
}

type AdminDashboardResponse struct {
	Stats          AdminDashboardStats  `json:"stats"`
	AllProjects    []AdminProjectDetail `json:"all_projects"`
	AllTasks       []AdminTaskDetail    `json:"all_tasks"`
	RecentActivity []RecentActivity     `json:"recent_activity"`
}

// ==================== Manager Dashboard Models ====================

type ManagerTaskStats struct {
	TotalTasks      int64 `json:"total_tasks"`
	TodoTasks       int64 `json:"todo_tasks"`
	InProgressTasks int64 `json:"in_progress_tasks"`
	DoneTasks       int64 `json:"done_tasks"`
	OverdueTasks    int64 `json:"overdue_tasks"`
}

type ManagerProjectStats struct {
	TotalProjects     int64 `json:"total_projects"`
	ActiveProjects    int64 `json:"active_projects"`
	CompletedProjects int64 `json:"completed_projects"`
}

type ManagerDashboardStats struct {
	ProjectStats ManagerProjectStats `json:"project_stats"`
	TaskStats    ManagerTaskStats    `json:"task_stats"`
	TotalMembers int64               `json:"total_members"`
}

type ManagerProjectDetail struct {
	ID              uuid.UUID `json:"id"`
	Name            string    `json:"name"`
	TotalMembers    int64     `json:"total_members"`
	TotalTasks      int64     `json:"total_tasks"`
	TodoTasks       int64     `json:"todo_tasks"`
	InProgressTasks int64     `json:"in_progress_tasks"`
	DoneTasks       int64     `json:"done_tasks"`
	Progress        float64   `json:"progress"`
	CreatedAt       time.Time `json:"created_at"`
}

type ManagerTaskDetail struct {
	ID           uuid.UUID  `json:"id"`
	Title        string     `json:"title"`
	Status       string     `json:"status"`
	AssigneeName *string    `json:"assignee_name"`
	DueDate      *time.Time `json:"due_date"`
	IsOverdue    bool       `json:"is_overdue"`
	CreatedAt    time.Time  `json:"created_at"`
}

type ManagerDashboardResponse struct {
	Stats           ManagerDashboardStats  `json:"stats"`
	MyProjects      []ManagerProjectDetail `json:"my_projects"`
	MyProjectsTasks []ManagerTaskDetail    `json:"my_projects_tasks"`
	RecentActivity  []RecentActivity       `json:"recent_activity"`
}

// ==================== Staff Dashboard Models ====================

type StaffTaskStats struct {
	TotalTasks      int64 `json:"total_tasks"`
	TodoTasks       int64 `json:"todo_tasks"`
	InProgressTasks int64 `json:"in_progress_tasks"`
	DoneTasks       int64 `json:"done_tasks"`
	OverdueTasks    int64 `json:"overdue_tasks"`
}

type StaffDashboardStats struct {
	TaskStats     StaffTaskStats `json:"task_stats"`
	TotalProjects int64          `json:"total_projects"`
}

type StaffTaskDetail struct {
	ID          uuid.UUID  `json:"id"`
	Title       string     `json:"title"`
	ProjectName string     `json:"project_name"`
	Status      string     `json:"status"`
	DueDate     *time.Time `json:"due_date"`
	IsOverdue   bool       `json:"is_overdue"`
	CreatedAt   time.Time  `json:"created_at"`
}

type StaffDashboardResponse struct {
	Stats          StaffDashboardStats `json:"stats"`
	MyTasks        []StaffTaskDetail   `json:"my_tasks"`
	RecentActivity []RecentActivity    `json:"recent_activity"`
}

// ==================== Shared Models ====================

type ChartData struct {
	Label string `json:"label"`
	Value int64  `json:"value"`
}

type TaskStatusChart struct {
	Todo       int64 `json:"todo"`
	InProgress int64 `json:"in_progress"`
	Done       int64 `json:"done"`
}

type ProjectProgressChart struct {
	ProjectName string  `json:"project_name"`
	Progress    float64 `json:"progress"`
}

type DashboardFilter struct {
	DateRange string    `json:"date_range"`
	StartDate time.Time `json:"start_date"`
	EndDate   time.Time `json:"end_date"`
	ProjectID uuid.UUID `json:"project_id"`
	Status    string    `json:"status"`
}
