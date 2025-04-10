from django.shortcuts import render

import requests
import logging
from django.conf import settings
from requests.auth import HTTPBasicAuth

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated # Import permission class

logger = logging.getLogger(__name__)

# --- Helper Function for Jenkins API Calls ---
def make_jenkins_request(api_path):
    """Makes an authenticated request to the Jenkins API."""
    jenkins_url = settings.JENKINS_URL
    username = settings.JENKINS_USERNAME
    api_token = settings.JENKINS_API_TOKEN

    if not all([jenkins_url, username, api_token]):
         logger.error("Jenkins URL, Username, or API Token is not configured in Django settings.")
         return None, "Jenkins connection details missing in settings."

    # Ensure JENKINS_URL doesn't end with a slash if api_path starts with one
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
        if response.status_code == 204: # No Content
            return {}, None # Success, but no JSON body
        return response.json(), None # Success, return JSON data
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


# --- DRF API View to List Jobs ---
class JenkinsJobList(APIView):
    """
    API endpoint to list Jenkins jobs.
    Requires authentication (valid JWT).
    """
    permission_classes = [IsAuthenticated] # Protect this view

    def get(self, request, format=None):
        """Handles GET requests to list jobs."""
        api_path = 'api/json?tree=jobs[name,url]'
        data, error_msg = make_jenkins_request(api_path)

        if error_msg:
            # Return a DRF error response
            return Response({'error': f'Failed to fetch jobs: {error_msg}'}, status=status.HTTP_502_BAD_GATEWAY)

        if data is not None and 'jobs' in data:
            jobs = [{'name': job['name'], 'url': job['url']} for job in data['jobs']]
            return Response({'jobs': jobs}, status=status.HTTP_200_OK)
        else:
            logger.warning(f"Jenkins API response for listing jobs was unexpected: {data}")
            return Response({'jobs': []}, status=status.HTTP_200_OK)


# --- DRF API View to Get Job Build Details ---
class JenkinsJobDetail(APIView):
    """
    API endpoint to get build details for a specific Jenkins job.
    Requires authentication (valid JWT).
    """
    permission_classes = [IsAuthenticated] # Protect this view

    def get(self, request, job_name, format=None):
        """Handles GET requests for job details."""
        # Fetch builds with commit info
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

                if start_time_ms is not None and duration_ms is not None and not building:
                    end_time_ms = start_time_ms + duration_ms

                commit_messages = []
                if build.get('changeSet') and build['changeSet'].get('items'):
                    commit_messages = [
                        f"{item.get('author', {}).get('fullName', 'Unknown Author')}: {item.get('msg', 'No commit message')}"
                        for item in build['changeSet']['items']
                    ]

                build_details.append({
                    'number': build.get('number'),
                    'url': build.get('url'),
                    'start_time_ms': start_time_ms,
                    'end_time_ms': end_time_ms,
                    'duration_ms': duration_ms,
                    'result': build.get('result'),
                    'building': building,
                    'description': build.get('description'),
                    'commit_messages': commit_messages,
                })
            build_details.sort(key=lambda x: x.get('number') or 0, reverse=True)
            return Response({'builds': build_details}, status=status.HTTP_200_OK)
        else:
            logger.warning(f"Jenkins API response for job '{job_name}' details was unexpected or empty: {data}")
            return Response({'builds': []}, status=status.HTTP_200_OK) # Return empty list if no builds found
