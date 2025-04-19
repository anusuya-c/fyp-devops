# argocd_integration/views.py

import requests
from django.conf import settings
from django.http import JsonResponse # Import JsonResponse
import logging # Optional: for better logging

logger = logging.getLogger(__name__) # Optional

def _make_argocd_request(api_path):
    """
    Helper function to make requests to the Argo CD API.
    Takes the API endpoint path (e.g., '/api/v1/applications') as input.
    Returns a tuple: (data, error_message, status_code)
    status_code is None for non-HTTP errors, or the HTTP status code otherwise.
    """
    if not settings.ARGOCD_URL or not settings.ARGOCD_API_TOKEN:
        return None, "Argo CD URL or API Token not configured in settings.", 500 # Internal Server Error

    base_url = settings.ARGOCD_URL.rstrip('/')
    full_url = f"{base_url}{api_path}"
    headers = {
        'Authorization': f'Bearer {settings.ARGOCD_API_TOKEN}'
    }

    try:
        response = requests.get(full_url, headers=headers, verify=settings.ARGOCD_VERIFY_SSL, timeout=10)
        response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)
        return response.json(), None, response.status_code # Return JSON data, no error, status code
    except requests.exceptions.Timeout:
        err_msg = f"Request timed out connecting to Argo CD at {settings.ARGOCD_URL}"
        logger.error(err_msg)
        return None, err_msg, 504 # Gateway Timeout
    except requests.exceptions.ConnectionError as e:
        err_msg = f"Connection error connecting to Argo CD at {settings.ARGOCD_URL}: {e}"
        logger.error(err_msg)
        return None, err_msg, 503 # Service Unavailable
    except requests.exceptions.HTTPError as e:
        status_code = e.response.status_code
        error_detail = f"Argo CD API returned error: {status_code} {e.response.reason}"
        try:
            # Try to get more specific error from Argo CD response if possible
            argo_error = e.response.json()
            error_detail += f" - {argo_error.get('error', e.response.text)}" # Prefer 'error' field if present
        except ValueError: # Handle cases where response is not JSON
             error_detail += f" - {e.response.text}"
        logger.error(f"HTTP error fetching {full_url}: {error_detail}")
        return None, error_detail, status_code
    except requests.exceptions.RequestException as e:
        err_msg = f"An unexpected network error occurred: {e}"
        logger.error(err_msg)
        return None, err_msg, 500 # Internal Server Error
    except ValueError: # JSONDecodeError inherits from ValueError
        err_msg = f"Failed to decode JSON response from Argo CD API at {full_url}"
        logger.error(err_msg)
        return None, err_msg, 500 # Internal Server Error


def application_list_api(request):
    """
    API view to fetch and return the list of Argo CD applications as JSON.
    """
    data, error, status_code = _make_argocd_request('/api/v1/applications')

    if error:
        # Use the status_code returned by the helper, default to 500 if it's None
        response_status = status_code if isinstance(status_code, int) else 500
        return JsonResponse({'error': error}, status=response_status)

    # Optionally filter or restructure data if needed for the frontend
    # For now, return the raw data structure from Argo CD
    # Example: you might only want specific fields:
    # simplified_apps = [{
    #     'name': app.get('metadata', {}).get('name'),
    #     'status': app.get('status', {}).get('sync', {}).get('status'),
    #     'health': app.get('status', {}).get('health', {}).get('status'),
    #     # Add other fields as needed
    # } for app in data.get('items', [])]
    # return JsonResponse({'applications': simplified_apps}, status=200)

    # Return the full data fetched
    return JsonResponse(data, status=200, safe=False) # safe=False is needed if data is a list at the top level, Argo returns dict here.


# --- Add more API views for other endpoints ---

# Example: API View for Projects
# def project_list_api(request):
#     data, error, status_code = _make_argocd_request('/api/v1/projects') # Assuming endpoint
#     if error:
#          response_status = status_code if isinstance(status_code, int) else 500
#          return JsonResponse({'error': error}, status=response_status)
#
#     # Return the full data or restructure as needed
#     return JsonResponse(data, status=200)

# Example: API View for Notifications
# def notification_list_api(request):
#     # Find the correct API endpoint for notifications
#     # data, error, status_code = _make_argocd_request('/api/v1/YOUR_NOTIFICATION_ENDPOINT')
#     # if error:
#     #      response_status = status_code if isinstance(status_code, int) else 500
#     #      return JsonResponse({'error': error}, status=response_status)
#     #
#     # return JsonResponse(data, status=200)
#     pass