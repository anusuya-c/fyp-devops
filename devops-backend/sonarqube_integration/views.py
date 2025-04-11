from django.shortcuts import render

import requests
import logging
from django.conf import settings
# Note: SonarQube token auth typically uses HTTP Basic Auth with the token as username,
# or an Authorization: Bearer header. We'll use Basic Auth like the previous client.
from requests.auth import HTTPBasicAuth

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated # Assuming you want to protect these too

logger = logging.getLogger(__name__)

# --- Helper Function for SonarQube API Calls ---
def make_sonarqube_request(api_endpoint, params=None):
    """Makes an authenticated request to the SonarQube Web API."""
    sonar_url = settings.SONARQUBE_URL
    api_token = settings.SONARQUBE_API_TOKEN
    api_base = f"{sonar_url}/api" # Construct base API URL

    if not api_token: # Only need token for auth
        logger.error("SONARQUBE_API_TOKEN is not configured in Django settings.")
        return None, "SonarQube API Token missing in settings."

    # Construct full URL
    url = f"{api_base}/{api_endpoint.lstrip('/')}" # Ensure no double slashes

    # Authentication: Use token as username, empty password for Basic Auth
    auth = HTTPBasicAuth(api_token, '')

    try:
        response = requests.get(url, params=params, auth=auth, timeout=15) # 15 sec timeout
        response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)

        # Handle successful responses
        if response.status_code == 204: # No Content
             return {}, None # Success, but no JSON body
        # Check content type before parsing JSON
        if 'application/json' in response.headers.get('Content-Type', ''):
            return response.json(), None # Success, return JSON data
        else:
            # Handle cases where response might be text etc., though unlikely for these endpoints
             logger.warning(f"SonarQube API ({url}) returned non-JSON response: {response.text[:100]}...")
             return {"raw_content": response.text}, None # Return raw content if needed

    except requests.exceptions.Timeout:
        msg = f"Timeout connecting to SonarQube API ({url})"
        logger.error(msg)
        return None, msg
    except requests.exceptions.ConnectionError:
        msg = f"Connection error to SonarQube API ({url})"
        logger.error(msg)
        return None, msg
    except requests.exceptions.HTTPError as e:
        # Specific handling for 404 might be useful here if needed downstream
        status_code = e.response.status_code
        msg = f"SonarQube API HTTP error ({url}): {status_code} {e.response.reason}"
        logger.error(msg)
        # You could return the status code along with the message if needed
        return None, msg # Or return (None, msg, status_code)
    except requests.exceptions.RequestException as e:
        msg = f"Generic error fetching from SonarQube API ({url}): {e}"
        logger.error(msg)
        return None, msg
    except Exception as e:
        msg = f"Unexpected error during SonarQube API request ({url}): {e}"
        logger.exception(msg) # Log full traceback for unexpected errors
        return None, msg

# --- DRF API View to List SonarQube Projects ---
class SonarQubeProjectsListView(APIView):
    """
    API endpoint to list SonarQube projects.
    Requires authentication.
    """
    permission_classes = [IsAuthenticated] # Protect this view

    def get(self, request, format=None):
        """Handles GET requests to list projects."""
        endpoint = 'projects/search'
        # SonarQube API uses pagination, fetch more if needed (simplified here)
        # Increase 'ps' (page size) parameter to get more results per request
        params = {'ps': 500} # Get up to 500 projects
        data, error_msg = make_sonarqube_request(endpoint, params=params)

        if error_msg:
            # Determine appropriate status code based on error if possible
            status_code = status.HTTP_503_SERVICE_UNAVAILABLE # Default if unknown
            if "Timeout" in error_msg or "Connection error" in error_msg:
                 status_code = status.HTTP_504_GATEWAY_TIMEOUT
            elif "HTTP error" in error_msg:
                 # Could parse status from message, but 502 is generally suitable
                 status_code = status.HTTP_502_BAD_GATEWAY

            return Response({'error': f'Failed to fetch projects: {error_msg}'}, status=status_code)

        if data is not None and 'components' in data:
            # Extract relevant project information
            projects = [
                {
                    'key': comp['key'],
                    'name': comp['name'],
                    'qualifier': comp['qualifier'],
                    'visibility': comp['visibility'],
                }
                for comp in data.get('components', [])
            ]
            return Response({'projects': projects}, status=status.HTTP_200_OK)
        else:
            logger.warning(f"SonarQube API response for listing projects was unexpected: {data}")
            # Return empty list if structure is wrong or components missing
            return Response({'projects': []}, status=status.HTTP_200_OK)


# --- DRF API View to Get SonarQube Project Details (Metrics) ---
class SonarQubeProjectDetailsView(APIView):
    """
    API endpoint to get details (metrics) for a specific SonarQube project.
    Requires authentication.
    """
    permission_classes = [IsAuthenticated] # Protect this view

    def get(self, request, project_key, format=None):
        """Handles GET requests for project details."""
        endpoint = 'measures/component'

        # Get list of metric keys (use default or from query param)
        metric_keys_param = request.query_params.get('metrics')
        if metric_keys_param:
            metric_keys_list = [key.strip() for key in metric_keys_param.split(',')]
        else:
            metric_keys_list = settings.SONARQUBE_DEFAULT_METRIC_KEYS

        if not metric_keys_list:
             return Response({"projectKey": project_key, "metrics": {}}, status=status.HTTP_200_OK)

        params = {
            'component': project_key,
            'metricKeys': ','.join(metric_keys_list) # API expects comma-separated string
        }

        data, error_msg = make_sonarqube_request(endpoint, params=params)

        if error_msg:
            status_code = status.HTTP_503_SERVICE_UNAVAILABLE
            # Check for 404 specifically if the helper passed that info
            if "404" in error_msg:
                 status_code = status.HTTP_404_NOT_FOUND
            elif "Timeout" in error_msg or "Connection error" in error_msg:
                 status_code = status.HTTP_504_GATEWAY_TIMEOUT
            elif "HTTP error" in error_msg:
                 status_code = status.HTTP_502_BAD_GATEWAY

            return Response(
                {'error': f'Failed to fetch job details for {project_key}: {error_msg}'},
                status=status_code
            )

        # Process successful response
        if data is not None and 'component' in data:
            component_data = data.get('component', {})
            measures_list = component_data.get('measures', [])
            # Convert list of measures to a dictionary
            measures_dict = {m['metric']: m.get('value', m.get('periods', None)) for m in measures_list}
            response_data = {
                "projectKey": project_key,
                "metrics": measures_dict
            }
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            logger.warning(f"SonarQube API response for project '{project_key}' details was unexpected: {data}")
            # Return empty metrics if structure is wrong
            return Response({"projectKey": project_key, "metrics": {}}, status=status.HTTP_200_OK)
