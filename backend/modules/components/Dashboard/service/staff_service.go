package dashboardservice

import (
	dashboardmodel "gintugas/modules/components/Dashboard/model"
	dashboardrepository "gintugas/modules/components/Dashboard/repository"

	"github.com/google/uuid"
)

type StaffDashboardService interface {
	GetStaffDashboard(staffID uuid.UUID) (*dashboardmodel.StaffDashboardResponse, error)
	GetStaffTasks(staffID uuid.UUID, limit int, offset int) ([]dashboardmodel.StaffTaskDetail, error)
}

type staffDashboardService struct {
	repo dashboardrepository.DashboardRepository
}

func NewStaffDashboardService(repo dashboardrepository.DashboardRepository) StaffDashboardService {
	return &staffDashboardService{
		repo: repo,
	}
}

func (s *staffDashboardService) GetStaffDashboard(staffID uuid.UUID) (*dashboardmodel.StaffDashboardResponse, error) {

	stats, err := s.repo.GetStaffDashboardStats(staffID)
	if err != nil {
		return nil, err
	}

	tasks, err := s.repo.GetStaffTasks(staffID, 10, 0)
	if err != nil {
		return nil, err
	}

	activity, err := s.repo.GetRecentActivity(10)
	if err != nil {
		return nil, err
	}

	return &dashboardmodel.StaffDashboardResponse{
		Stats:          *stats,
		MyTasks:        tasks,
		RecentActivity: activity,
	}, nil
}

func (s *staffDashboardService) GetStaffTasks(staffID uuid.UUID, limit int, offset int) ([]dashboardmodel.StaffTaskDetail, error) {
	return s.repo.GetStaffTasks(staffID, limit, offset)
}
