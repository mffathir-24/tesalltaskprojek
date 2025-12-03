package dashboardservice

import (
	dashboardmodel "gintugas/modules/components/Dashboard/model"
	dashboardrepository "gintugas/modules/components/Dashboard/repository"
)

type AdminDashboardService interface {
	GetAdminDashboard() (*dashboardmodel.AdminDashboardResponse, error)
	GetAdminProjects(limit int, offset int) ([]dashboardmodel.AdminProjectDetail, error)
	GetAdminTasks(limit int, offset int) ([]dashboardmodel.AdminTaskDetail, error)
}

type adminDashboardService struct {
	repo dashboardrepository.DashboardRepository
}

func NewAdminDashboardService(repo dashboardrepository.DashboardRepository) AdminDashboardService {
	return &adminDashboardService{
		repo: repo,
	}
}

func (s *adminDashboardService) GetAdminDashboard() (*dashboardmodel.AdminDashboardResponse, error) {

	stats, err := s.repo.GetAdminDashboardStats()
	if err != nil {
		return nil, err
	}

	projects, err := s.repo.GetAllProjects(10, 0)
	if err != nil {
		return nil, err
	}

	tasks, err := s.repo.GetAllTasks(10, 0)
	if err != nil {
		return nil, err
	}

	activity, err := s.repo.GetRecentActivity(10)
	if err != nil {
		return nil, err
	}

	return &dashboardmodel.AdminDashboardResponse{
		Stats:          *stats,
		AllProjects:    projects,
		AllTasks:       tasks,
		RecentActivity: activity,
	}, nil
}

func (s *adminDashboardService) GetAdminProjects(limit int, offset int) ([]dashboardmodel.AdminProjectDetail, error) {
	return s.repo.GetAllProjects(limit, offset)
}

func (s *adminDashboardService) GetAdminTasks(limit int, offset int) ([]dashboardmodel.AdminTaskDetail, error) {
	return s.repo.GetAllTasks(limit, offset)
}
