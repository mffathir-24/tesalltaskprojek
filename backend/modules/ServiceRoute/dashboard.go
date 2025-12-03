package serviceroute

import (
	"strconv"

	dashboardrepository "gintugas/modules/components/Dashboard/repository"
	dashboardservice "gintugas/modules/components/Dashboard/service"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DashboardHandler struct {
	adminService   dashboardservice.AdminDashboardService
	managerService dashboardservice.ManagerDashboardService
	staffService   dashboardservice.StaffDashboardService
}

func NewDashboardHandler(db *gorm.DB) *DashboardHandler {
	repo := dashboardrepository.NewDashboardRepository(db)
	return &DashboardHandler{
		adminService:   dashboardservice.NewAdminDashboardService(repo),
		managerService: dashboardservice.NewManagerDashboardService(repo),
		staffService:   dashboardservice.NewStaffDashboardService(repo),
	}
}

// GetAdminDashboard godoc
// @Summary Get admin dashboard
// @Description Mendapatkan dashboard untuk admin dengan statistik keseluruhan project dan task
// @Tags dashboard
// @Produce json
// @Security BearerAuth
// @Success 200 {object} dashboardmodel.AdminDashboardResponse
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Router /api/dashboard/admin [get]
func (h *DashboardHandler) GetAdminDashboard(c *gin.Context) {
	dashboard, err := h.adminService.GetAdminDashboard()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch admin dashboard: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Admin dashboard retrieved successfully",
		"data":    dashboard,
	})
}

// GetAdminDashboardProjects godoc
// @Summary Get all projects for admin
// @Description Mendapatkan semua project dengan detail statistik
// @Tags dashboard
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Limit" default(10)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Router /api/dashboard/admin/projects [get]
func (h *DashboardHandler) GetAdminDashboardProjects(c *gin.Context) {
	limit := 10
	offset := 0

	if l := c.Query("limit"); l != "" {
		var err error
		if limit, err = parseInt(l); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid limit"})
			return
		}
	}

	if o := c.Query("offset"); o != "" {
		var err error
		if offset, err = parseInt(o); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid offset"})
			return
		}
	}

	projects, err := h.adminService.GetAdminProjects(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch projects: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Projects retrieved successfully",
		"data":    projects,
	})
}

// GetAdminDashboardTasks godoc
// @Summary Get all tasks for admin
// @Description Mendapatkan semua task dengan detail
// @Tags dashboard
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Limit" default(10)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Router /api/dashboard/admin/tasks [get]
func (h *DashboardHandler) GetAdminDashboardTasks(c *gin.Context) {
	limit := 10
	offset := 0

	if l := c.Query("limit"); l != "" {
		var err error
		if limit, err = parseInt(l); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid limit"})
			return
		}
	}

	if o := c.Query("offset"); o != "" {
		var err error
		if offset, err = parseInt(o); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid offset"})
			return
		}
	}

	tasks, err := h.adminService.GetAdminTasks(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch tasks: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Tasks retrieved successfully",
		"data":    tasks,
	})
}

// GetManagerDashboard godoc
// @Summary Get manager dashboard
// @Description Mendapatkan dashboard untuk manager dengan statistik project dan task yang dia buat
// @Tags dashboard
// @Produce json
// @Security BearerAuth
// @Success 200 {object} dashboardmodel.ManagerDashboardResponse
// @Failure 401 {object} map[string]interface{}
// @Router /api/dashboard/manager [get]
func (h *DashboardHandler) GetManagerDashboard(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	managerID, err := parseUUID(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	dashboard, err := h.managerService.GetManagerDashboard(managerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch manager dashboard: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Manager dashboard retrieved successfully",
		"data":    dashboard,
	})
}

// GetManagerProjects godoc
// @Summary Get manager projects
// @Description Mendapatkan project yang dibuat manager
// @Tags dashboard
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Limit" default(10)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /api/dashboard/manager/projects [get]
func (h *DashboardHandler) GetManagerProjects(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	managerID, err := parseUUID(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	limit := 10
	offset := 0

	if l := c.Query("limit"); l != "" {
		if limit, err = parseInt(l); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid limit"})
			return
		}
	}

	if o := c.Query("offset"); o != "" {
		if offset, err = parseInt(o); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid offset"})
			return
		}
	}

	projects, err := h.managerService.GetManagerProjects(managerID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch manager projects: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Manager projects retrieved successfully",
		"data":    projects,
	})
}

// GetManagerTasks godoc
// @Summary Get manager tasks
// @Description Mendapatkan task dari project yang dibuat manager
// @Tags dashboard
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Limit" default(10)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /api/dashboard/manager/tasks [get]
func (h *DashboardHandler) GetManagerTasks(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	managerID, err := parseUUID(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	limit := 10
	offset := 0

	if l := c.Query("limit"); l != "" {
		if limit, err = parseInt(l); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid limit"})
			return
		}
	}

	if o := c.Query("offset"); o != "" {
		if offset, err = parseInt(o); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid offset"})
			return
		}
	}

	tasks, err := h.managerService.GetManagerProjectsTasks(managerID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch manager tasks: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Manager tasks retrieved successfully",
		"data":    tasks,
	})
}

// GetStaffDashboard godoc
// @Summary Get staff dashboard
// @Description Mendapatkan dashboard untuk staff dengan statistik task yang ditugaskan
// @Tags dashboard
// @Produce json
// @Security BearerAuth
// @Success 200 {object} dashboardmodel.StaffDashboardResponse
// @Failure 401 {object} map[string]interface{}
// @Router /api/dashboard/staff [get]
func (h *DashboardHandler) GetStaffDashboard(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	staffID, err := parseUUID(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	dashboard, err := h.staffService.GetStaffDashboard(staffID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch staff dashboard: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Staff dashboard retrieved successfully",
		"data":    dashboard,
	})
}

// GetStaffTasks godoc
// @Summary Get staff tasks
// @Description Mendapatkan task yang ditugaskan ke staff
// @Tags dashboard
// @Produce json
// @Security BearerAuth
// @Param limit query int false "Limit" default(10)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /api/dashboard/staff/tasks [get]
func (h *DashboardHandler) GetStaffTasks(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
		return
	}

	staffID, err := parseUUID(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	limit := 10
	offset := 0

	if l := c.Query("limit"); l != "" {
		if limit, err = parseInt(l); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid limit"})
			return
		}
	}

	if o := c.Query("offset"); o != "" {
		if offset, err = parseInt(o); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid offset"})
			return
		}
	}

	tasks, err := h.staffService.GetStaffTasks(staffID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch staff tasks: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Staff tasks retrieved successfully",
		"data":    tasks,
	})
}

// Helper functions
func parseUUID(s string) (uuid.UUID, error) {
	return uuid.Parse(s)
}

func parseInt(s string) (int, error) {
	return strconv.Atoi(s)
}
