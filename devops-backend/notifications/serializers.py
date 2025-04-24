from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'build_number', 'build_status', 'job_name', 'is_seen', 'created_at'] 