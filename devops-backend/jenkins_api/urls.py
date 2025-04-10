
from django.urls import path
from .views import JenkinsJobList, JenkinsJobDetail 

urlpatterns = [
    path('jobs/', JenkinsJobList.as_view(), name='list_jenkins_jobs'),
    path('jobs/<str:job_name>/details/', JenkinsJobDetail.as_view(), name='get_jenkins_job_details'),
]