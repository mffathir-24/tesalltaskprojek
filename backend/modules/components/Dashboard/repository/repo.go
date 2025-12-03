package dashboardrepository

import (
	dashboardmodel "gintugas/modules/components/Dashboard/model"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DashboardRepository interface {
	GetAdminDashboardStats() (*dashboardmodel.AdminDashboardStats, error)
	GetAllProjects(limit int, offset int) ([]dashboardmodel.AdminProjectDetail, error)
	GetAllTasks(limit int, offset int) ([]dashboardmodel.AdminTaskDetail, error)
	GetRecentActivity(limit int) ([]dashboardmodel.RecentActivity, error)
	GetTaskCountByStatus() (dashboardmodel.AdminTaskStats, error)
	GetProjectCountByStatus() (dashboardmodel.AdminProjectStats, error)

	GetManagerDashboardStats(managerID uuid.UUID) (*dashboardmodel.ManagerDashboardStats, error)
	GetManagerProjects(managerID uuid.UUID, limit int, offset int) ([]dashboardmodel.ManagerProjectDetail, error)
	GetManagerProjectsTasks(managerID uuid.UUID, limit int, offset int) ([]dashboardmodel.ManagerTaskDetail, error)
	GetManagerTaskCountByStatus(managerID uuid.UUID) (dashboardmodel.ManagerTaskStats, error)
	GetManagerProjectCountByStatus(managerID uuid.UUID) (dashboardmodel.ManagerProjectStats, error)
	GetManagerProjectMembers(managerID uuid.UUID) (int64, error)

	GetStaffDashboardStats(staffID uuid.UUID) (*dashboardmodel.StaffDashboardStats, error)
	GetStaffTasks(staffID uuid.UUID, limit int, offset int) ([]dashboardmodel.StaffTaskDetail, error)
	GetStaffTaskCountByStatus(staffID uuid.UUID) (dashboardmodel.StaffTaskStats, error)
	GetStaffProjectCount(staffID uuid.UUID) (int64, error)

	GetOverdueTasks() (int64, error)
	GetOverdueTasksByUser(userID uuid.UUID) (int64, error)
}

type repository struct {
	db *gorm.DB
}

func NewDashboardRepository(db *gorm.DB) DashboardRepository {
	return &repository{db: db}
}

// ==================== Admin Dashboard Methods ====================

func (r *repository) GetAdminDashboardStats() (*dashboardmodel.AdminDashboardStats, error) {
	projectStats, err := r.GetProjectCountByStatus()
	if err != nil {
		return nil, err
	}

	taskStats, err := r.GetTaskCountByStatus()
	if err != nil {
		return nil, err
	}

	var totalUsers int64
	err = r.db.Table("users").Count(&totalUsers).Error
	if err != nil {
		return nil, err
	}

	return &dashboardmodel.AdminDashboardStats{
		ProjectStats: projectStats,
		TaskStats:    taskStats,
		TotalUsers:   totalUsers,
	}, nil
}

func (r *repository) GetProjectCountByStatus() (dashboardmodel.AdminProjectStats, error) {
	var stats dashboardmodel.AdminProjectStats

	r.db.Table("projects").Count(&stats.TotalProjects)

	r.db.Table("projects").
		Joins("LEFT JOIN tasks ON projects.id = tasks.project_id").
		Where("tasks.status IN ('todo', 'in-progress')").
		Distinct("projects.id").
		Count(&stats.ActiveProjects)

	r.db.Table("projects p").
		Where("NOT EXISTS (SELECT 1 FROM tasks WHERE project_id = p.id AND status != 'done')").
		Where("EXISTS (SELECT 1 FROM tasks WHERE project_id = p.id)").
		Count(&stats.CompletedProjects)

	return stats, nil
}

func (r *repository) GetTaskCountByStatus() (dashboardmodel.AdminTaskStats, error) {
	var stats dashboardmodel.AdminTaskStats

	r.db.Table("tasks").Count(&stats.TotalTasks)
	r.db.Table("tasks").Where("status = ?", "todo").Count(&stats.TodoTasks)
	r.db.Table("tasks").Where("status = ?", "in-progress").Count(&stats.InProgressTasks)
	r.db.Table("tasks").Where("status = ?", "done").Count(&stats.DoneTasks)

	now := time.Now()
	r.db.Table("tasks").
		Where("status != ? AND due_date IS NOT NULL AND due_date < ?", "done", now).
		Count(&stats.OverdueTasks)

	return stats, nil
}

func (r *repository) GetAllProjects(limit int, offset int) ([]dashboardmodel.AdminProjectDetail, error) {
	var projects []dashboardmodel.AdminProjectDetail

	query := `
		SELECT 
			p.id,
			p.nama as name,
			u.username as manager_name,
			COUNT(DISTINCT t.id) as total_tasks,
			COUNT(DISTINCT CASE WHEN t.status = 'todo' THEN t.id END) as todo_tasks,
			COUNT(DISTINCT CASE WHEN t.status = 'in-progress' THEN t.id END) as in_progress_tasks,
			COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as done_tasks,
			CASE 
				WHEN COUNT(DISTINCT t.id) = 0 THEN 0
				ELSE (COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) * 100.0) / COUNT(DISTINCT t.id)
			END as progress,
			p.created_at
		FROM projects p
		LEFT JOIN users u ON p.manager_id = u.id
		LEFT JOIN tasks t ON p.id = t.project_id
		GROUP BY p.id, p.nama, u.username, p.created_at
		ORDER BY p.created_at DESC
		LIMIT ? OFFSET ?
	`

	err := r.db.Raw(query, limit, offset).Scan(&projects).Error
	if err != nil {
		return nil, err
	}

	return projects, nil
}

func (r *repository) GetAllTasks(limit int, offset int) ([]dashboardmodel.AdminTaskDetail, error) {
	var tasks []dashboardmodel.AdminTaskDetail

	query := `
		SELECT 
			t.id,
			t.title,
			p.nama as project_name,
			t.status,
			u.username as assignee_name,
			t.due_date,
			CASE WHEN t.status != 'done' AND t.due_date IS NOT NULL AND t.due_date < NOW() THEN true ELSE false END as is_overdue,
			t.created_at
		FROM tasks t
		LEFT JOIN projects p ON t.project_id = p.id
		LEFT JOIN users u ON t.assignee_id = u.id
		ORDER BY t.created_at DESC
		LIMIT ? OFFSET ?
	`

	err := r.db.Raw(query, limit, offset).Scan(&tasks).Error
	if err != nil {
		return nil, err
	}

	return tasks, nil
}

func (r *repository) GetRecentActivity(limit int) ([]dashboardmodel.RecentActivity, error) {
	var activities []dashboardmodel.RecentActivity

	query := `
		SELECT 
			t.id,
			'task_update' as type,
			u.id as user_id,
			u.username as user_name,
			t.title as message,
			t.id as target_id,
			'task' as target_type,
			t.updated_at as created_at
		FROM tasks t
		LEFT JOIN users u ON t.assignee_id = u.id
		ORDER BY t.updated_at DESC
		LIMIT ?
	`

	err := r.db.Raw(query, limit).Scan(&activities).Error
	if err != nil {
		return nil, err
	}

	return activities, nil
}

func (r *repository) GetOverdueTasks() (int64, error) {
	var count int64
	now := time.Now()
	err := r.db.Table("tasks").
		Where("status != ? AND due_date IS NOT NULL AND due_date < ?", "done", now).
		Count(&count).Error
	return count, err
}

// ==================== Manager Dashboard Methods ====================

func (r *repository) GetManagerDashboardStats(managerID uuid.UUID) (*dashboardmodel.ManagerDashboardStats, error) {
	projectStats, err := r.GetManagerProjectCountByStatus(managerID)
	if err != nil {
		return nil, err
	}

	taskStats, err := r.GetManagerTaskCountByStatus(managerID)
	if err != nil {
		return nil, err
	}

	totalMembers, err := r.GetManagerProjectMembers(managerID)
	if err != nil {
		return nil, err
	}

	return &dashboardmodel.ManagerDashboardStats{
		ProjectStats: projectStats,
		TaskStats:    taskStats,
		TotalMembers: totalMembers,
	}, nil
}

func (r *repository) GetManagerProjectCountByStatus(managerID uuid.UUID) (dashboardmodel.ManagerProjectStats, error) {
	var stats dashboardmodel.ManagerProjectStats

	r.db.Table("projects").Where("manager_id = ?", managerID).Count(&stats.TotalProjects)

	r.db.Table("projects p").
		Joins("LEFT JOIN tasks t ON p.id = t.project_id").
		Where("p.manager_id = ? AND t.status IN ('todo', 'in-progress')", managerID).
		Distinct("p.id").
		Count(&stats.ActiveProjects)

	r.db.Table("projects p").
		Where("p.manager_id = ?", managerID).
		Where("NOT EXISTS (SELECT 1 FROM tasks WHERE project_id = p.id AND status != 'done')").
		Where("EXISTS (SELECT 1 FROM tasks WHERE project_id = p.id)").
		Count(&stats.CompletedProjects)

	return stats, nil
}

func (r *repository) GetManagerTaskCountByStatus(managerID uuid.UUID) (dashboardmodel.ManagerTaskStats, error) {
	var stats dashboardmodel.ManagerTaskStats

	r.db.Table("tasks t").
		Joins("JOIN projects p ON t.project_id = p.id").
		Where("p.manager_id = ?", managerID).
		Count(&stats.TotalTasks)

	r.db.Table("tasks t").
		Joins("JOIN projects p ON t.project_id = p.id").
		Where("p.manager_id = ? AND t.status = ?", managerID, "todo").
		Count(&stats.TodoTasks)

	r.db.Table("tasks t").
		Joins("JOIN projects p ON t.project_id = p.id").
		Where("p.manager_id = ? AND t.status = ?", managerID, "in-progress").
		Count(&stats.InProgressTasks)

	r.db.Table("tasks t").
		Joins("JOIN projects p ON t.project_id = p.id").
		Where("p.manager_id = ? AND t.status = ?", managerID, "done").
		Count(&stats.DoneTasks)

	now := time.Now()
	r.db.Table("tasks t").
		Joins("JOIN projects p ON t.project_id = p.id").
		Where("p.manager_id = ? AND t.status != ? AND t.due_date IS NOT NULL AND t.due_date < ?", managerID, "done", now).
		Count(&stats.OverdueTasks)

	return stats, nil
}

func (r *repository) GetManagerProjectMembers(managerID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Table("project_members pm").
		Joins("JOIN projects p ON pm.project_id = p.id").
		Where("p.manager_id = ?", managerID).
		Distinct("pm.user_id").
		Count(&count).Error
	return count, err
}

func (r *repository) GetManagerProjects(managerID uuid.UUID, limit int, offset int) ([]dashboardmodel.ManagerProjectDetail, error) {
	var projects []dashboardmodel.ManagerProjectDetail

	query := `
		SELECT 
			p.id,
			p.nama as name,
			COUNT(DISTINCT pm.user_id) as total_members,
			COUNT(DISTINCT t.id) as total_tasks,
			COUNT(DISTINCT CASE WHEN t.status = 'todo' THEN t.id END) as todo_tasks,
			COUNT(DISTINCT CASE WHEN t.status = 'in-progress' THEN t.id END) as in_progress_tasks,
			COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as done_tasks,
			CASE 
				WHEN COUNT(DISTINCT t.id) = 0 THEN 0
				ELSE (COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) * 100.0) / COUNT(DISTINCT t.id)
			END as progress,
			p.created_at
		FROM projects p
		LEFT JOIN project_members pm ON p.id = pm.project_id
		LEFT JOIN tasks t ON p.id = t.project_id
		WHERE p.manager_id = ?
		GROUP BY p.id, p.nama, p.created_at
		ORDER BY p.created_at DESC
		LIMIT ? OFFSET ?
	`

	err := r.db.Raw(query, managerID, limit, offset).Scan(&projects).Error
	if err != nil {
		return nil, err
	}

	return projects, nil
}

func (r *repository) GetManagerProjectsTasks(managerID uuid.UUID, limit int, offset int) ([]dashboardmodel.ManagerTaskDetail, error) {
	var tasks []dashboardmodel.ManagerTaskDetail

	query := `
		SELECT 
			t.id,
			t.title,
			t.status,
			u.username as assignee_name,
			t.due_date,
			CASE WHEN t.status != 'done' AND t.due_date IS NOT NULL AND t.due_date < NOW() THEN true ELSE false END as is_overdue,
			t.created_at
		FROM tasks t
		LEFT JOIN projects p ON t.project_id = p.id
		LEFT JOIN users u ON t.assignee_id = u.id
		WHERE p.manager_id = ?
		ORDER BY t.created_at DESC
		LIMIT ? OFFSET ?
	`

	err := r.db.Raw(query, managerID, limit, offset).Scan(&tasks).Error
	if err != nil {
		return nil, err
	}

	return tasks, nil
}

func (r *repository) GetOverdueTasksByUser(userID uuid.UUID) (int64, error) {
	var count int64
	now := time.Now()
	err := r.db.Table("tasks").
		Where("assignee_id = ? AND status != ? AND due_date IS NOT NULL AND due_date < ?", userID, "done", now).
		Count(&count).Error
	return count, err
}

// ==================== Staff Dashboard Methods ====================

func (r *repository) GetStaffDashboardStats(staffID uuid.UUID) (*dashboardmodel.StaffDashboardStats, error) {
	taskStats, err := r.GetStaffTaskCountByStatus(staffID)
	if err != nil {
		return nil, err
	}

	projectCount, err := r.GetStaffProjectCount(staffID)
	if err != nil {
		return nil, err
	}

	return &dashboardmodel.StaffDashboardStats{
		TaskStats:     taskStats,
		TotalProjects: projectCount,
	}, nil
}

func (r *repository) GetStaffTaskCountByStatus(staffID uuid.UUID) (dashboardmodel.StaffTaskStats, error) {
	var stats dashboardmodel.StaffTaskStats

	r.db.Table("tasks").Where("assignee_id = ?", staffID).Count(&stats.TotalTasks)
	r.db.Table("tasks").Where("assignee_id = ? AND status = ?", staffID, "todo").Count(&stats.TodoTasks)
	r.db.Table("tasks").Where("assignee_id = ? AND status = ?", staffID, "in-progress").Count(&stats.InProgressTasks)
	r.db.Table("tasks").Where("assignee_id = ? AND status = ?", staffID, "done").Count(&stats.DoneTasks)

	now := time.Now()
	r.db.Table("tasks").
		Where("assignee_id = ? AND status != ? AND due_date IS NOT NULL AND due_date < ?", staffID, "done", now).
		Count(&stats.OverdueTasks)

	return stats, nil
}

func (r *repository) GetStaffProjectCount(staffID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Table("projects p").
		Joins("JOIN tasks t ON p.id = t.project_id").
		Where("t.assignee_id = ?", staffID).
		Distinct("p.id").
		Count(&count).Error
	return count, err
}

func (r *repository) GetStaffTasks(staffID uuid.UUID, limit int, offset int) ([]dashboardmodel.StaffTaskDetail, error) {
	var tasks []dashboardmodel.StaffTaskDetail

	query := `
		SELECT 
			t.id,
			t.title,
			p.nama as project_name,
			t.status,
			t.due_date,
			CASE WHEN t.status != 'done' AND t.due_date IS NOT NULL AND t.due_date < NOW() THEN true ELSE false END as is_overdue,
			t.created_at
		FROM tasks t
		LEFT JOIN projects p ON t.project_id = p.id
		WHERE t.assignee_id = ?
		ORDER BY t.created_at DESC
		LIMIT ? OFFSET ?
	`

	err := r.db.Raw(query, staffID, limit, offset).Scan(&tasks).Error
	if err != nil {
		return nil, err
	}

	return tasks, nil
}
