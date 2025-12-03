package modules

import (
	"database/sql"
	_ "gintugas/docs"
	serviceroute "gintugas/modules/ServiceRoute"
	controllers "gintugas/modules/components/Auth/controllers"
	middleware "gintugas/modules/components/Auth/middleware"
	role "gintugas/modules/components/Auth/middleware/middlewarerole"
	services "gintugas/modules/components/Mail/service"
	repositoryprojek "gintugas/modules/components/Project/repository"
	servissprj "gintugas/modules/components/Project/service"
	taskrepository "gintugas/modules/components/Tasks/repository"
	taskservice "gintugas/modules/components/Tasks/service"
	attachmentrepository "gintugas/modules/components/attachments/repository"
	attachmentservice "gintugas/modules/components/attachments/service"
	. "gintugas/modules/components/command/repository"
	. "gintugas/modules/components/command/service"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"gorm.io/gorm"
)

func Initiator(router *gin.Engine, db *sql.DB, gormDB *gorm.DB) {
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"}, // Atau specific: []string{"http://localhost:3000", "http://127.0.0.1:*"}
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	authHandler := controllers.NewAuthHandler(gormDB)

	memberRepo := repositoryprojek.NewProjectMemberRepo(gormDB)
	memberService := servissprj.NewProjectMemberService(memberRepo)

	taskRepo := taskrepository.NewTaskRepository(gormDB)

	mailService := services.NewMailService()
	taskService := taskservice.NewTaskService(taskRepo, mailService)
	taskController := serviceroute.NewTaskController(taskService)

	commentsRepo := NewCommentsRepository(gormDB)
	commentsService := NewTaskService(commentsRepo)
	commentsHandler := serviceroute.NewCommentsHandler(commentsService)

	attachmentRepo := attachmentrepository.NewAttachmentRepository(gormDB)

	//path menyimpan file
	uploadPath := "./uploads/attachments"
	attachmentService := attachmentservice.NewAttachmentService(attachmentRepo, uploadPath)
	attachmentHandler := serviceroute.NewAttachmentHandler(attachmentService)

	// Dashboard Handler
	dashboardHandler := serviceroute.NewDashboardHandler(gormDB)

	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	api := router.Group("/api")
	{

		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/logout", middleware.AuthMiddleware(), authHandler.Logout)
			auth.GET("/verify", middleware.AuthMiddleware(), authHandler.Verify)
		}

		api.GET("/users", serviceroute.GetAllUsersRouter(db))

		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			admin := protected.Group("/admin")
			admin.Use(role.RequireRole("admin"))
			{
				admin.GET("/users/:id", serviceroute.GetUsersRouter(db))
				admin.PUT("/users/:id", serviceroute.UpdateUsersRouter(db))
				admin.DELETE("/users/:id", serviceroute.DeleteUsersRouter(db))

				// Admin Dashboard Routes
				adminDashboard := admin.Group("/dashboard")
				{
					adminDashboard.GET("", dashboardHandler.GetAdminDashboard)
					adminDashboard.GET("/projects", dashboardHandler.GetAdminDashboardProjects)
					adminDashboard.GET("/tasks", dashboardHandler.GetAdminDashboardTasks)
				}
			}
			// User routes

			manager := protected.Group("")
			manager.Use(role.RequireRole("admin", "manager"))
			{
				// Project routes
				manager.POST("/project", serviceroute.CreateProjectRouter(db))
				manager.GET("/project", serviceroute.GetAllProjektRouter(db))
				manager.GET("/project/:id", serviceroute.GetProjectRouter(db))
				manager.PUT("/project/:id", serviceroute.UpdateProjectRouter(db))
				manager.DELETE("/project/:id", serviceroute.DeleteProjectRouter(db))

				member := manager.Group("/projects/:project_id/members")
				{
					member.POST("", memberService.AddMember)
					member.GET("", memberService.GetProjectMembers)
					member.DELETE("/:user_id", memberService.RemoveMember)
				}

				// Tasks Route
				tasks := manager.Group("/projects/:project_id/tasks")
				{
					tasks.POST("", taskController.CreateTask)
					tasks.GET("", taskController.GetProjectTasks)
					tasks.PUT("/:task_id", taskController.UpdateTask)
					tasks.DELETE("/:task_id", taskController.DeleteTask)
				}

				// Manager Dashboard Routes
				managerDashboard := manager.Group("/dashboard/manager")
				{
					managerDashboard.GET("", dashboardHandler.GetManagerDashboard)
					managerDashboard.GET("/projects", dashboardHandler.GetManagerProjects)
					managerDashboard.GET("/tasks", dashboardHandler.GetManagerTasks)
				}
			}

			staff := protected.Group("")
			staff.Use(role.RequireRole("admin", "manager", "staff"))
			{
				//Comments Route
				comments := staff.Group("/tasks/:task_id/comments")
				{
					comments.POST("", commentsHandler.CreateComments)
					comments.GET("", commentsHandler.GetTasksComments)
					comments.GET("/:comments_id", commentsHandler.GetCommentsByID)
					comments.PUT("/:comments_id", commentsHandler.UpdateComments)
					comments.DELETE("/:comments_id", commentsHandler.DeleteComments)
				}

				attachments := staff.Group("")
				{
					//upload ke task berdasarkan id
					attachments.POST("/tasks/:task_id/attachments", attachmentHandler.UploadAttachment)
					attachments.GET("/tasks/:task_id/attachments", attachmentHandler.GetTaskAttachments)
					attachments.DELETE("/attachments/:attachment_id", attachmentHandler.DeleteAttachment)
				}
				staff.GET("/projects/:project_id/tasks/:task_id", taskController.GetTaskByID)
				staff.GET("/my-tasks", taskController.GetMyTasks)

				// Staff Dashboard Routes
				staffDashboard := staff.Group("/dashboard/staff")
				{
					staffDashboard.GET("", dashboardHandler.GetStaffDashboard)
					staffDashboard.GET("/tasks", dashboardHandler.GetStaffTasks)
				}
			}
		}

		download := api.Group("/attachments")
		download.Use(middleware.AuthDownloadMiddleware())
		{
			download.GET("/:attachment_id/download", attachmentHandler.DownloadAttachment)
		}

	}
}
