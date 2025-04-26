"""
URL configuration for devops project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views
from django.conf import settings
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from accounts.views import CustomPasswordResetView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('dj_rest_auth.urls')),
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),
    
    # Password reset URLs
    path('api/auth/password/reset/', 
         CustomPasswordResetView.as_view(
             success_url=settings.FRONTEND_URL + '/password-reset-done/',
             html_email_template_name='email/password_reset_email.html',
             subject_template_name='email/password_reset_subject.txt',
             email_template_name='email/password_reset_email.html',
         ), 
         name='password_reset'),
    path('api/auth/password/reset/done/', 
         auth_views.PasswordResetDoneView.as_view(), 
         name='password_reset_done'),
    path('api/auth/password/reset/<uidb64>/<token>/', 
         auth_views.PasswordResetConfirmView.as_view(
             success_url=settings.FRONTEND_URL + '/password-reset-complete/',
         ), 
         name='password_reset_confirm'),
    path('api/auth/password/reset/complete/', 
         auth_views.PasswordResetCompleteView.as_view(), 
         name='password_reset_complete'),
    
    # Other API endpoints
    path('api/jenkins/', include('jenkins_api.urls')),
    path('api/sonarqube/', include('sonarqube_integration.urls')),
    path('api/kubernetes/', include('kubernetes_integration.urls')),
    path('api/ec2/', include('ec2_metrics.urls')),
    path('api/argocd/', include('argocd_integration.urls')),
    path('api/notifications/', include('notifications.urls')),
]
