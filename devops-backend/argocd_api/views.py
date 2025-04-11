from django.shortcuts import render
# argocd_api/views.py

import requests
import logging
from django.conf import settings
from django.core.cache import cache
# from django.shortcuts import render # Remove if not used

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated # Assuming you use this for auth

logger = logging.getLogger(__name__)

# --- Constants ---
ARGOCD_CACHE_KEY = 'argocd_api_auth_token'
# Read timeout from settings (defined in settings.py step)
ARGOCD_TOKEN_CACHE_TIMEOUT = settings.ARGOCD_TOKEN_CACHE_TIMEOUT


# --- Function to Get/Refresh Argo CD Token using Username/Password ---
def _get_argocd_token():
    """
    Retrieves a valid Argo CD auth token, using cache or fetching a new one.
    Uses username/password defined in settings.
    Returns (token, error_message)
    """
    token = cache.get(ARGOCD_CACHE_KEY)
    if token:
        logger.debug("Using cached Argo CD token.")
        return token, None

    logger.info("Argo CD token not found in cache or expired. Fetching new token...")
    argocd_url = settings.ARGOCD_SERVER_URL
    username = settings.ARGOCD_USERNAME
    password = settings.ARGOCD_PASSWORD
    ssl_verify = settings.ARGOCD_SSL_VERIFY

    if not all([argocd_url, username, password]):
        msg = "Argo CD Server URL, Username, or Password is not configured in Django settings."
        logger.error(msg)
        return None, msg

    session_url = f"{argocd_url.rstrip('/')}/api/v1/session"
    payload = {"username": username, "password": password}
    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(session_url, json=payload, headers=headers, timeout=10, verify=ssl_verify)
        response.raise_for_status()
        response_data = response.json()
        new_token = response_data.get('token')

        if not new_token:
            msg = "Failed to retrieve token from Argo CD session response."
            logger.error(f"{msg} Response: {response_data}")
            return None, msg

        cache.set(ARGOCD_CACHE_KEY, new_token, timeout=ARGOCD_TOKEN_CACHE_TIMEOUT)
        logger.info(f"Successfully fetched and cached new Argo CD token (timeout: {ARGOCD_TOKEN_CACHE_TIMEOUT}s).")
        return new_token, None

    except requests.exceptions.Timeout:
        msg = f"Timeout connecting to Argo CD session endpoint ({session_url})"
        logger.error(msg)
        return None, msg
    except requests.exceptions.ConnectionError as e:
        msg = f"Connection error to Argo CD session endpoint ({session_url}): {e}"
        logger.error(msg)
        return None, msg
    except requests.exceptions.SSLError as e:
        msg = f"SSL error connecting to Argo CD session endpoint ({session_url}). Check ARGOCD_SSL_VERIFY setting. Error: {e}"
        logger.error(msg)
        return None, msg
    except requests.exceptions.HTTPError as e:
        error_details = e.response.text[:500] if e.response else "No response body"
        msg = f"Argo CD session HTTP error ({session_url}): {e.response.status_code} {e.response.reason}. Details: {error_details}"
        if e.response and e.response.status_code in [401, 403]:
            msg += " (Check Argo CD Username/Password)"
        logger.error(msg)
        return None, msg
    except requests.exceptions.RequestException as e:
        msg = f"Generic error during Argo CD session request ({session_url}): {e}"
        logger.error(msg)
        return None, msg
    except ValueError: # Handles JSONDecodeError
        msg = f"Failed to decode JSON response from Argo CD session endpoint ({session_url})"
        logger.error(f"{msg}. Response text (start): {response.text[:200]}...")
        return None, msg
    except Exception as e:
        msg = f"Unexpected error during Argo CD session request ({session_url}): {e}"
        logger.exception(msg)
        return None, msg


# --- Helper Function for General Argo CD API Calls ---
def make_argocd_request(api_path, method='GET', payload=None):
    """
    Makes an authenticated request to the Argo CD API using a token obtained
    via username/password login (with caching). Supports different HTTP methods.
    """
    token, token_error = _get_argocd_token()
    if token_error or not token:
        return None, f"Argo CD authentication failed: {token_error or 'Could not retrieve token.'}"

    argocd_url = settings.ARGOCD_SERVER_URL
    ssl_verify = settings.ARGOCD_SSL_VERIFY
    url = f"{argocd_url.rstrip('/')}{api_path if api_path.startswith('/') else '/' + api_path}"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    try:
        logger.debug(f"Making Argo CD request: {method} {url}")
        if method.upper() == 'GET':
            response = requests.get(url, headers=headers, timeout=15, verify=ssl_verify)
        elif method.upper() == 'POST':
             response = requests.post(url, headers=headers, json=payload, timeout=15, verify=ssl_verify)
        # Add elif for PUT, DELETE etc. if needed
        else:
            return None, f"Unsupported HTTP method: {method}"

        response.raise_for_status()

        if response.status_code == 204: return {}, None

        content_type = response.headers.get('Content-Type', '')
        if 'application/json' in content_type:
            try:
                return response.json(), None
            except ValueError:
                msg = f"Failed to decode JSON response despite correct content-type from Argo CD API ({method} {url})"
                logger.error(f"{msg}. Response text (start): {response.text[:200]}...")
                return None, msg
        else:
            logger.warning(f"Argo CD API ({method} {url}) returned non-JSON response: {response.text[:100]}...")
            return response.text, None

    except requests.exceptions.Timeout:
        msg = f"Timeout during Argo CD API request ({method} {url})"
        logger.error(msg); return None, msg
    except requests.exceptions.ConnectionError as e:
        msg = f"Connection error during Argo CD API request ({method} {url}): {e}"
        logger.error(msg); return None, msg
    except requests.exceptions.SSLError as e:
        msg = f"SSL error during Argo CD API request ({method} {url}). Check ARGOCD_SSL_VERIFY setting. Error: {e}"
        logger.error(msg); return None, msg
    except requests.exceptions.HTTPError as e:
        error_details = e.response.text[:500] if e.response else "No response body"
        msg = f"Argo CD API HTTP error ({method} {url}): {e.response.status_code} {e.response.reason}. Details: {error_details}"
        logger.error(msg)
        if e.response and e.response.status_code in [401, 403]:
             logger.warning("Received 401/403 on API call, clearing cached Argo CD token.")
             cache.delete(ARGOCD_CACHE_KEY)
             msg += " (Cached token might have been invalid or expired)"
        try:
            error_json = e.response.json()
            err_msg = error_json.get('message') or error_json.get('error', '')
            if err_msg: msg = f"Argo CD API Error: {err_msg} (Status: {e.response.status_code})"
        except: pass
        return None, msg
    except requests.exceptions.RequestException as e:
        msg = f"Generic error during Argo CD API request ({method} {url}): {e}"
        logger.error(msg); return None, msg
    except Exception as e:
        msg = f"Unexpected error during Argo CD API request ({method} {url}): {e}"
        logger.exception(msg); return None, msg


# --- DRF API Views ---
class ArgoApplicationList(APIView):
    """Lists Argo CD applications with basic status."""
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        api_path = '/api/v1/applications?fields=items.metadata.name,items.status.sync.status,items.status.health.status,items.spec.source.repoURL,items.spec.source.path'
        data, error_msg = make_argocd_request(api_path)
        if error_msg: return Response({'error': f'Failed to fetch Argo CD applications: {error_msg}'}, status=status.HTTP_502_BAD_GATEWAY)

        if data is not None and isinstance(data, dict) and 'items' in data:
            apps = [{'name': item.get('metadata', {}).get('name'),
                     'sync_status': item.get('status', {}).get('sync', {}).get('status'),
                     'health_status': item.get('status', {}).get('health', {}).get('status'),
                     'repo_url': item.get('spec', {}).get('source', {}).get('repoURL'),
                     'path': item.get('spec', {}).get('source', {}).get('path')}
                    for item in data.get('items', [])]
            return Response({'applications': apps}, status=status.HTTP_200_OK)
        else:
            logger.warning(f"Argo CD API response for listing applications unexpected: {str(data)[:200]}")
            return Response({'applications': []}, status=status.HTTP_200_OK)


class ArgoApplicationDetail(APIView):
    """Gets detailed status for a specific Argo CD application."""
    permission_classes = [IsAuthenticated]

    def get(self, request, app_name, format=None):
        api_path = f"/api/v1/applications/{app_name}"
        data, error_msg = make_argocd_request(api_path)
        if error_msg:
             if "404" in error_msg or "NotFound" in error_msg or "not found" in error_msg.lower():
                 return Response({'error': f"Argo CD application '{app_name}' not found."}, status=status.HTTP_404_NOT_FOUND)
             else:
                return Response({'error': f'Failed to fetch Argo CD application details: {error_msg}'}, status=status.HTTP_502_BAD_GATEWAY)

        if data is not None and isinstance(data, dict):
            metadata = data.get('metadata', {}); status_info = data.get('status', {})
            spec = data.get('spec', {}); source = spec.get('source', {})
            destination = spec.get('destination', {})
            details = {'name': metadata.get('name'),
                       'namespace': metadata.get('namespace'), 'project': spec.get('project'),
                       'server': destination.get('server'), 'destination_namespace': destination.get('namespace'),
                       'repo_url': source.get('repoURL'), 'path': source.get('path'),
                       'target_revision': source.get('targetRevision'),
                       'sync_status': status_info.get('sync', {}).get('status'),
                       'health_status': status_info.get('health', {}).get('status'),
                       'health_message': status_info.get('health', {}).get('message'),
                       'sync_compared_to': status_info.get('sync', {}).get('comparedTo', {}),
                       'resources': status_info.get('resources', []),
                       'history': status_info.get('history', [])}
            return Response(details, status=status.HTTP_200_OK)
        else:
            logger.warning(f"Argo CD API response for app '{app_name}' details unexpected: {str(data)[:200]}")
            return Response({'error': f"Could not retrieve valid details for Argo CD application '{app_name}'."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)