from django.urls import path
from . import views # Import the views from the same app

urlpatterns = [
    path('projects/', views.SonarQubeProjectsListView.as_view(), name='sonarqube-projects-list'),
    path('projects/<str:project_key>/details/', views.SonarQubeProjectDetailsView.as_view(), name='sonarqube-project-details'),
]