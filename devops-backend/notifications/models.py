from django.db import models
from django.contrib.auth.models import User

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    build_number = models.IntegerField()
    build_status = models.CharField(max_length=50)
    job_name = models.CharField(max_length=255)
    is_seen = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Build #{self.build_number} - {self.job_name} - {self.build_status}"
