# argocd_integration/urls.py

from django.urls import path
from . import views

app_name = 'argocd_integration' # Namespace for URLs

urlpatterns = [
    # Point to the API view function now
    path('applications/', views.application_list_api, name='application_list_api'),
]