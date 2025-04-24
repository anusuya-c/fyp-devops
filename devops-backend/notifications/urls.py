from django.urls import path
from .views import NotificationListView, NotificationMarkSeenView

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification-list'),
    path('<int:notification_id>/mark-seen/', NotificationMarkSeenView.as_view(), name='notification-mark-seen'),
] 