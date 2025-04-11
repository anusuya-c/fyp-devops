from django.urls import path
from . import views

urlpatterns = [
    path('metrics/pods/', views.KubernetesPodMetricsView.as_view(), name='kubernetes-pod-metrics'),
]