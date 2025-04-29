from django.shortcuts import render

import logging
import decimal 
from django.conf import settings

from kubernetes import client, config
from kubernetes.client.rest import ApiException

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

logger = logging.getLogger(__name__)

def parse_cpu(cpu_str):
    """Convert Kubernetes CPU string to cores."""
    if not cpu_str:
        return 0.0
    try:
        if cpu_str.endswith('m'):
            return float(cpu_str[:-1]) / 1000.0
        return float(cpu_str)
    except ValueError:
        logger.warning(f"Could not parse CPU value: {cpu_str}")
        return 0.0

def parse_memory(mem_str):
    """Convert Kubernetes memory string to bytes."""
    if not mem_str:
        return 0
    mem_str = mem_str.upper()
    try:
        if mem_str.endswith('KI'):
            return int(mem_str[:-2]) * 1024
        elif mem_str.endswith('MI'):
            return int(mem_str[:-2]) * 1024 * 1024
        elif mem_str.endswith('GI'):
            return int(mem_str[:-2]) * 1024 * 1024 * 1024
        elif mem_str.endswith('TI'):
             return int(mem_str[:-2]) * 1024 * 1024 * 1024 * 1024
        elif mem_str.endswith('PI'):
             return int(mem_str[:-2]) * 1024 * 1024 * 1024 * 1024 * 1024
        elif mem_str.endswith('EI'):
             return int(mem_str[:-2]) * 1024 * 1024 * 1024 * 1024 * 1024 * 1024
        elif mem_str.endswith('K'):
            return int(mem_str[:-1]) * 1000
        elif mem_str.endswith('M'):
            return int(mem_str[:-1]) * 1000 * 1000
        elif mem_str.endswith('G'):
            return int(mem_str[:-1]) * 1000 * 1000 * 1000
        else:
            return int(mem_str)
    except (ValueError, TypeError):
        logger.warning(f"Could not parse memory value: {mem_str}")
        return 0

# --- Helper Function for Kubernetes Metrics API Calls ---
_k8s_api_client = None # Cache the client instance

def get_k8s_pod_metrics():
    """Fetch pod metrics from Kubernetes Metrics API."""
    global _k8s_api_client

    if not _k8s_api_client:
        try:
            if settings.KUBERNETES_CONFIG_PATH:
                logger.info(f"Loading K8s config from: {settings.KUBERNETES_CONFIG_PATH}")
                config.load_kube_config(config_file=settings.KUBERNETES_CONFIG_PATH)
            else:
                logger.info("Loading K8s in-cluster config.")
                config.load_incluster_config()
            _k8s_api_client = client.ApiClient()
        except config.ConfigException as e:
            msg = f"Could not configure Kubernetes client: {e}. Ensure KUBERNETES_CONFIG_PATH is set correctly or running in-cluster."
            logger.error(msg)
            return None, msg
        except Exception as e:
            msg = f"Unexpected error configuring Kubernetes client: {e}"
            logger.exception(msg)
            return None, msg

    custom_api = client.CustomObjectsApi(_k8s_api_client)
    group = "metrics.k8s.io"
    version = "v1beta1"
    plural = "pods"

    try:
        api_response = custom_api.list_cluster_custom_object(group, version, plural)
        pod_metrics = []
        if api_response and 'items' in api_response:
            for item in api_response['items']:
                metadata = item.get('metadata', {})
                pod_name = metadata.get('name')
                namespace = metadata.get('namespace')
                timestamp = item.get('timestamp')
                containers_metrics = []

                if 'containers' in item and isinstance(item['containers'], list):
                    for container in item['containers']:
                        usage = container.get('usage', {})
                        cpu_usage_str = usage.get('cpu')
                        mem_usage_str = usage.get('memory')
                        containers_metrics.append({
                            'name': container.get('name'),
                            'cpu_cores': parse_cpu(cpu_usage_str),
                            'memory_bytes': parse_memory(mem_usage_str)
                        })

                if pod_name and namespace:
                    pod_metrics.append({
                        'name': pod_name,
                        'namespace': namespace,
                        'timestamp': timestamp,
                        'containers': containers_metrics
                    })
        else:
             logger.warning(f"Kubernetes Metrics API response structure unexpected: {api_response}")

        return pod_metrics, None

    except ApiException as e:
        status_code = e.status
        reason = e.reason
        body = e.body
        msg = f"Kubernetes API error fetching pod metrics: {status_code} {reason} - Body: {body[:200]}..."
        logger.error(msg)
        if status_code == 401 or status_code == 403:
             return None, f"Authorization error connecting to Kubernetes API ({status_code}). Check credentials/permissions."
        elif status_code == 404:
             return None, f"Metrics API endpoint ({group}/{version}/{plural}) not found ({status_code}). Is Metrics Server running?"
        return None, f"Kubernetes API error: {status_code} {reason}"
    except Exception as e:
        msg = f"Unexpected error fetching Kubernetes pod metrics: {e}"
        logger.exception(msg)
        return None, msg

class KubernetesPodMetricsView(APIView):
    """
    API endpoint to get CPU and Memory usage for Kubernetes pods.
    Requires authentication.
    """
    permission_classes = [IsAuthenticated] # Protect this view

    def get(self, request, format=None):
        """Handles GET requests for pod metrics."""

        data, error_msg = get_k8s_pod_metrics()

        if error_msg:
            status_code = status.HTTP_503_SERVICE_UNAVAILABLE # Default
            if "Authorization error" in error_msg:
                 status_code = status.HTTP_403_FORBIDDEN
            elif "not found" in error_msg:
                 status_code = status.HTTP_404_NOT_FOUND
            elif "API error" in error_msg:
                 status_code = status.HTTP_502_BAD_GATEWAY

            return Response({'error': f'Failed to fetch pod metrics: {error_msg}'}, status=status_code)

        if data is not None:
            return Response({'pod_metrics': data}, status=status.HTTP_200_OK)
        else:
            # Should have been caught by error_msg, but as a fallback
            logger.error("Pod metrics fetch returned None data without an error message.")
            return Response({'error': 'An unknown error occurred while fetching pod metrics'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)