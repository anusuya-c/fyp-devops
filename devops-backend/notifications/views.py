from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer
import logging

logger = logging.getLogger(__name__)

# Create your views here.

class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            logger.info(f"Fetching notifications for user: {request.user.id}")
            notifications = Notification.objects.filter(user=request.user)
            logger.info(f"Found {notifications.count()} notifications")
            serializer = NotificationSerializer(notifications, many=True)
            logger.info(f"Serialized data: {serializer.data}")
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error fetching notifications: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class NotificationMarkSeenView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, notification_id):
        try:
            notification = Notification.objects.get(id=notification_id, user=request.user)
            notification.is_seen = True
            notification.save()
            return Response({'status': 'success'})
        except Notification.DoesNotExist:
            return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)
