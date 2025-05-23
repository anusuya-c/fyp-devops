from django.shortcuts import render

import requests
import logging
from django.conf import settings
from requests.auth import HTTPBasicAuth
from notifications.models import Notification

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated 

logger = logging.getLogger(__name__)

def make_jenkins_request(api_path):
    jenkins_url = settings.JENKINS_URL
    username = settings.JENKINS_USERNAME
    api_token = settings.JENKINS_API_TOKEN

    if not all([jenkins_url, username, api_token]):
         logger.error("Jenkins URL, Username, or API Token is not configured in Django settings.")
         return None, "Jenkins connection details missing in settings."

    if jenkins_url.endswith('/') and api_path.startswith('/'):
        url = f"{jenkins_url}{api_path[1:]}"
    elif not jenkins_url.endswith('/') and not api_path.startswith('/'):
        url = f"{jenkins_url}/{api_path}"
    else:
        url = f"{jenkins_url}{api_path}"

    auth = HTTPBasicAuth(username, api_token)

    try:
        response = requests.get(url, auth=auth, timeout=15)
        response.raise_for_status()
        if response.status_code == 204: 
            return {}, None 
        return response.json(), None 
    except requests.exceptions.Timeout:
        msg = f"Timeout connecting to Jenkins API ({url})"
        logger.error(msg)
        return None, msg
    except requests.exceptions.ConnectionError:
        msg = f"Connection error to Jenkins API ({url})"
        logger.error(msg)
        return None, msg
    except requests.exceptions.HTTPError as e:
        msg = f"Jenkins API HTTP error ({url}): {e.response.status_code} {e.response.reason}"
        logger.error(msg)
        return None, msg
    except requests.exceptions.RequestException as e:
        msg = f"Generic error fetching from Jenkins API ({url}): {e}"
        logger.error(msg)
        return None, msg
    except Exception as e: 
        msg = f"Unexpected error during Jenkins API request ({url}): {e}"
        logger.exception(msg) 
        return None, msg


class JenkinsJobList(APIView):
    permission_classes = [IsAuthenticated] 

    def get(self, request, format=None):
        api_path = 'api/json?tree=jobs[name,url]'
        data, error_msg = make_jenkins_request(api_path)

        if error_msg:
            return Response({'error': f'Failed to fetch jobs: {error_msg}'}, status=status.HTTP_502_BAD_GATEWAY)

        if data is not None and 'jobs' in data:
            jobs = [{'name': job['name'], 'url': job['url']} for job in data['jobs']]
            return Response({'jobs': jobs}, status=status.HTTP_200_OK)
        else:
            logger.warning(f"Jenkins API response for listing jobs was unexpected: {data}")
            return Response({'jobs': []}, status=status.HTTP_200_OK)


class JenkinsJobDetail(APIView):
    permission_classes = [IsAuthenticated] 

    def get(self, request, job_name, format=None):
        api_path = f"job/{job_name}/api/json?tree=builds[number,url,timestamp,duration,result,building,description,changeSet[items[msg,author[fullName]]]]"
        data, error_msg = make_jenkins_request(api_path)

        if error_msg:
            return Response({'error': f'Failed to fetch job details: {error_msg}'}, status=status.HTTP_502_BAD_GATEWAY)

        if data is not None and 'builds' in data:
            build_details = []
            for build in data['builds']:
                start_time_ms = build.get('timestamp')
                duration_ms = build.get('duration')
                end_time_ms = None
                building = build.get('building', False)
                build_number = build.get('number')
                build_result = build.get('result')

                if start_time_ms is not None and duration_ms is not None and not building:
                    end_time_ms = start_time_ms + duration_ms

                if build_number and build_result:
                    logger.info(f"Checking notification for build {build_number} of job {job_name}")
                    existing_notification = Notification.objects.filter(
                        user=request.user,
                        build_number=build_number,
                        job_name=job_name
                    ).first()
                    
                    if not existing_notification:
                        logger.info(f"Creating new notification for build {build_number} of job {job_name}")
                        try:
                            notification = Notification.objects.create(
                                user=request.user,
                                build_number=build_number,
                                build_status=build_result,
                                job_name=job_name
                            )
                            logger.info(f"Created notification with ID: {notification.id}")
                        except Exception as e:
                            logger.error(f"Error creating notification: {str(e)}")
                    else:
                        logger.info(f"Notification already exists for build {build_number} of job {job_name}")

                commit_messages = []
                if build.get('changeSet') and build['changeSet'].get('items'):
                    commit_messages = [
                        f"{item.get('author', {}).get('fullName', 'Unknown Author')}: {item.get('msg', 'No commit message')}"
                        for item in build['changeSet']['items']
                    ]

                build_details.append({
                    'number': build_number,
                    'url': build.get('url'),
                    'start_time_ms': start_time_ms,
                    'end_time_ms': end_time_ms,
                    'duration_ms': duration_ms,
                    'result': build_result,
                    'building': building,
                    'description': build.get('description'),
                    'commit_messages': commit_messages,
                })
            build_details.sort(key=lambda x: x.get('number') or 0, reverse=True)
            return Response({'builds': build_details}, status=status.HTTP_200_OK)
        else:
            logger.warning(f"Jenkins API response for job '{job_name}' details was unexpected or empty: {data}")
            return Response({'builds': []}, status=status.HTTP_200_OK) 