from django.shortcuts import render

import boto3
from datetime import datetime, timedelta
from django.conf import settings
from django.http import JsonResponse

def get_ec2_metrics(instance_id):
    """Fetches CPU utilization metrics for a given EC2 instance."""
    cloudwatch = boto3.client('cloudwatch', region_name='us-east-1a')
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(minutes=60)

    try:
        response = cloudwatch.get_metric_data(
            MetricDataQueries=[
                {
                    'Id': 'cpu_utilization',
                    'MetricStat': {
                        'Metric': {
                            'Namespace': 'AWS/EC2',
                            'MetricName': 'CPUUtilization',
                            'Dimensions': [
                                {'Name': 'InstanceId', 'Value': instance_id},
                            ],
                        },
                        'Period': 60,
                        'Stat': 'Average',
                    },
                },
            ],
            StartTime=start_time,
            EndTime=end_time,
        )

        cpu_data = response['MetricDataResults'][0]['Values']
        timestamps = response['MetricDataResults'][0]['Timestamps']

        return {'timestamps': timestamps, 'cpu_utilization': cpu_data}

    except Exception as e:
        print(f"Error fetching EC2 metrics: {e}")
        return None

def ec2_metrics_view(request):
    """View to fetch and return EC2 metrics for both instances."""

    instance_ids = settings.EC2_INSTANCE_IDS # get instances from settings.py
    metrics_data = {}

    for instance_id in instance_ids:
        metrics = get_ec2_metrics(instance_id)
        if metrics:
            metrics_data[instance_id] = metrics
        else:
            metrics_data[instance_id] = {'error': f'Failed to fetch metrics for {instance_id}'}

    return JsonResponse(metrics_data)