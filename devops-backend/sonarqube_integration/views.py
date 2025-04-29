from django.shortcuts import render

import requests
import logging
from django.conf import settings
from requests.auth import HTTPBasicAuth
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated 

logger = logging.getLogger(__name__)

def make_sonarqube_request(api_endpoint, params=None):
    sonar_url = settings.SONARQUBE_URL
    api_token = settings.SONARQUBE_API_TOKEN
    api_base = f"{sonar_url}/api" 

    if not api_token: 
        logger.error("SONARQUBE_API_TOKEN is not configured in Django settings.")
        return None, "SonarQube API Token missing in settings."

    url = f"{api_base}/{api_endpoint.lstrip('/')}" 

    auth = HTTPBasicAuth(api_token, '')

    try:
        response = requests.get(url, params=params, auth=auth, timeout=15) 
        response.raise_for_status() 

        if response.status_code == 204: 
             return {}, None 
        if 'application/json' in response.headers.get('Content-Type', ''):
            return response.json(), None 
        else:
             logger.warning(f"SonarQube API ({url}) returned non-JSON response: {response.text[:100]}...")
             return {"raw_content": response.text}, None 

    except requests.exceptions.Timeout:
        msg = f"Timeout connecting to SonarQube API ({url})"
        logger.error(msg)
        return None, msg
    except requests.exceptions.ConnectionError:
        msg = f"Connection error to SonarQube API ({url})"
        logger.error(msg)
        return None, msg
    except requests.exceptions.HTTPError as e:
        status_code = e.response.status_code
        msg = f"SonarQube API HTTP error ({url}): {status_code} {e.response.reason}"
        logger.error(msg)
        return None, msg 
    except requests.exceptions.RequestException as e:
        msg = f"Generic error fetching from SonarQube API ({url}): {e}"
        logger.error(msg)
        return None, msg
    except Exception as e:
        msg = f"Unexpected error during SonarQube API request ({url}): {e}"
        logger.exception(msg) 
        return None, msg

class SonarQubeProjectsListView(APIView):
    permission_classes = [IsAuthenticated] 

    def get(self, request, format=None):
        endpoint = 'projects/search'
        params = {'ps': 500} 
        data, error_msg = make_sonarqube_request(endpoint, params=params)

        if error_msg:
            status_code = status.HTTP_503_SERVICE_UNAVAILABLE 
            if "Timeout" in error_msg or "Connection error" in error_msg:
                 status_code = status.HTTP_504_GATEWAY_TIMEOUT
            elif "HTTP error" in error_msg:
                 status_code = status.HTTP_502_BAD_GATEWAY

            return Response({'error': f'Failed to fetch projects: {error_msg}'}, status=status_code)

        if data is not None and 'components' in data:
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
            return Response({'projects': []}, status=status.HTTP_200_OK)


class SonarQubeProjectDetailsView(APIView):
    permission_classes = [IsAuthenticated] 

    def get(self, request, project_key, format=None):
        endpoint = 'measures/component'

        metric_keys_param = request.query_params.get('metrics')
        if metric_keys_param:
            metric_keys_list = [key.strip() for key in metric_keys_param.split(',')]
        else:
            metric_keys_list = settings.SONARQUBE_DEFAULT_METRIC_KEYS

        if not metric_keys_list:
             return Response({"projectKey": project_key, "metrics": {}}, status=status.HTTP_200_OK)

        params = {
            'component': project_key,
            'metricKeys': ','.join(metric_keys_list) 
        }

        data, error_msg = make_sonarqube_request(endpoint, params=params)

        if error_msg:
            status_code = status.HTTP_503_SERVICE_UNAVAILABLE
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

        if data is not None and 'component' in data:
            component_data = data.get('component', {})
            measures_list = component_data.get('measures', [])
            measures_dict = {m['metric']: m.get('value', m.get('periods', None)) for m in measures_list}
            response_data = {
                "projectKey": project_key,
                "metrics": measures_dict
            }
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            logger.warning(f"SonarQube API response for project '{project_key}' details was unexpected: {data}")
            return Response({"projectKey": project_key, "metrics": {}}, status=status.HTTP_200_OK)
