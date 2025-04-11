from django.urls import path
from . import views

urlpatterns = [
    path('metrics/', views.ec2_metrics_view, name='ec2_metrics'),
]