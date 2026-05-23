from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import ServeSavedImageView

router = DefaultRouter()
router.register(r'employees', views.EmployeeViewSet)
router.register(r'hubs', views.HubViewSet)
router.register(r'attendance', views.AttendanceViewSet, basename='attendance')
router.register(r'edit-requests', views.EditRequestViewSet)
router.register(r'leave-requests', views.LeaveRequestViewSet)
router.register(r'employee-documents', views.EmployeeDocumentViewSet)
router.register(r'live-locations', views.LiveLocationViewSet)

router.register(r'payroll', views.PayrollViewSet)
router.register(r'activity-logs', views.ActivityLogViewSet, basename='activity-logs')
router.register(r'security-alerts', views.SecurityAlertViewSet, basename='security-alerts')
router.register(r'hr-permissions', views.HRPermissionViewSet, basename='hr-permissions')

urlpatterns = [
    path('meta/', views.MetaView.as_view(), name='meta'),
    path('meta/<str:key>/', views.MetaView.as_view(), name='meta_item'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('current-user/', views.CurrentUserView.as_view(), name='current_user'),
    path('stats/', views.EmployeeStatsView.as_view(), name='stats'),
    path('', include(router.urls)),
    path('toggle-account/<int:user_id>/', views.toggle_account_status, name='toggle_account_status'),
    path('lock-unlock-account/<int:employee_id>/', views.lock_unlock_account, name='lock_unlock_account'),
    path('reset-password/<int:employee_id>/', views.reset_password, name='reset_password'),
    path('change-password/', views.change_password, name='change_password'),
    path('payroll/download/<int:hub_id>/', views.download_hub_payroll_csv, name='download_hub_payroll_csv'),
    path('payroll/compute/', views.PayrollSummaryView.as_view(), name='payroll_compute'),
    # Permanent image serving from DB
    path('saved-images/<int:pk>/', ServeSavedImageView.as_view(), name='serve-saved-image'),
]
