package dashboardservice

import (
	dashboardmodel "gintugas/modules/components/Dashboard/model"
	dashboardrepository "gintugas/modules/components/Dashboard/repository"

	"github.com/google/uuid"
)

type ManagerDashboardService interface {
	GetManagerDashboard(managerID uuid.UUID) (*dashboardmodel.ManagerDashboardResponse, error)
	GetManagerProjects(managerID uuid.UUID, limit int, offset int) ([]dashboardmodel.ManagerProjectDetail, error)
	GetManagerProjectsTasks(managerID uuid.UUID, limit int, offset int) ([]dashboardmodel.ManagerTaskDetail, error)
}

type managerDashboardService struct {
	repo dashboardrepository.DashboardRepository
}

func NewManagerDashboardService(repo dashboardrepository.DashboardRepository) ManagerDashboardService {
	return &managerDashboardService{
		repo: repo,
	}
}

func (s *managerDashboardService) GetManagerDashboard(managerID uuid.UUID) (*dashboardmodel.ManagerDashboardResponse, error) {

	stats, err := s.repo.GetManagerDashboardStats(managerID)
	if err != nil {
		return nil, err
	}

	projects, err := s.repo.GetManagerProjects(managerID, 10, 0)
	if err != nil {
		return nil, err
	}

	tasks, err := s.repo.GetManagerProjectsTasks(managerID, 10, 0)
	if err != nil {
		return nil, err
	}

	activity, err := s.repo.GetRecentActivity(10)
	if err != nil {
		return nil, err
	}

	return &dashboardmodel.ManagerDashboardResponse{
		Stats:           *stats,
		MyProjects:      projects,
		MyProjectsTasks: tasks,
		RecentActivity:  activity,
	}, nil
}

func (s *managerDashboardService) GetManagerProjects(managerID uuid.UUID, limit int, offset int) ([]dashboardmodel.ManagerProjectDetail, error) {
	return s.repo.GetManagerProjects(managerID, limit, offset)
}

func (s *managerDashboardService) GetManagerProjectsTasks(managerID uuid.UUID, limit int, offset int) ([]dashboardmodel.ManagerTaskDetail, error) {
	return s.repo.GetManagerProjectsTasks(managerID, limit, offset)
}
