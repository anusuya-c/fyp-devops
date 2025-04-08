# accounts/urls.py
from django.urls import path
from . import views
from django.contrib.auth import views as auth_views # Import Django's built-in auth views

app_name = 'accounts' # Optional: Define an app namespace

urlpatterns = [
    path('signup/', views.signup_view, name='signup'),
    # Use Django's built-in LoginView
    path('login/', auth_views.LoginView.as_view(template_name='accounts/login.html'), name='login'),
    # Use Django's built-in LogoutView
    path('logout/', auth_views.LogoutView.as_view(next_page='accounts:login'), name='logout'), # Redirect to login page after logout
    # Add other paths if needed (e.g., profile, password change/reset)
]