# argocd_api/urls.py
from django.urls import path
from .views import ArgoApplicationList, ArgoApplicationDetail

app_name = 'argocd_api'

urlpatterns = [
    # Example: GET /api/v1/argocd/applications/
    path('applications/', ArgoApplicationList.as_view(), name='app_list'),
    # Example: GET /api/v1/argocd/applications/<app_name>/
    path('applications/<str:app_name>/', ArgoApplicationDetail.as_view(), name='app_detail'),
]