import requests
from django.conf import settings
from django.http import JsonResponse 
import logging 

logger = logging.getLogger(__name__) 

def _make_argocd_request(api_path):
    if not settings.ARGOCD_URL or not settings.ARGOCD_API_TOKEN:
        return None, "Argo CD URL or API Token not configured in settings.", 500 

    base_url = settings.ARGOCD_URL.rstrip('/')
    full_url = f"{base_url}{api_path}"
    headers = {
        'Authorization': f'Bearer {settings.ARGOCD_API_TOKEN}'
    }

    try:
        response = requests.get(full_url, headers=headers, verify=settings.ARGOCD_VERIFY_SSL, timeout=10)
        response.raise_for_status() 
        return response.json(), None, response.status_code 
    except requests.exceptions.Timeout:
        err_msg = f"Request timed out connecting to Argo CD at {settings.ARGOCD_URL}"
        logger.error(err_msg)
        return None, err_msg, 504 
    except requests.exceptions.ConnectionError as e:
        err_msg = f"Connection error connecting to Argo CD at {settings.ARGOCD_URL}: {e}"
        logger.error(err_msg)
        return None, err_msg, 503 
    except requests.exceptions.HTTPError as e:
        status_code = e.response.status_code
        error_detail = f"Argo CD API returned error: {status_code} {e.response.reason}"
        try:
            argo_error = e.response.json()
            error_detail += f" - {argo_error.get('error', e.response.text)}" 
        except ValueError: 
             error_detail += f" - {e.response.text}"
        logger.error(f"HTTP error fetching {full_url}: {error_detail}")
        return None, error_detail, status_code
    except requests.exceptions.RequestException as e:
        err_msg = f"An unexpected network error occurred: {e}"
        logger.error(err_msg)
        return None, err_msg, 500 
    except ValueError: 
        err_msg = f"Failed to decode JSON response from Argo CD API at {full_url}"
        logger.error(err_msg)
        return None, err_msg, 500 


def application_list_api(request):
    data, error, status_code = _make_argocd_request('/api/v1/applications')

    if error:
        response_status = status_code if isinstance(status_code, int) else 500
        return JsonResponse({'error': error}, status=response_status)
        
    return JsonResponse(data, status=200, safe=False) 


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