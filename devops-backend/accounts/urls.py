from django.urls import path
from . import views
from django.contrib.auth import views as auth_views #Django's built-in auth views

app_name = 'accounts' 

urlpatterns = [
    path('signup/', views.signup_view, name='signup'),
    # Django's built-in LoginView
    path('login/', auth_views.LoginView.as_view(template_name='accounts/login.html'), name='login'),
    # Django's built-in LogoutView
    path('logout/', auth_views.LogoutView.as_view(next_page='accounts:login'), name='logout'), # Redirect to login page after logout
]