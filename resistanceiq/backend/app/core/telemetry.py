"""
ResistanceIQ — Production Observability, Metrics & Structured Telemetry Engine
"""

import time
import uuid
import logging
import json
from collections import defaultdict
from typing import Dict, Any, List, Optional
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("resistanceiq.telemetry")


class MetricsCollector:
    """
    Thread-safe operational telemetry collector for request latency,
    HTTP status distribution, and real ML inference metrics.
    """

    def __init__(self):
        self.request_count: int = 0
        self.status_counts: Dict[str, int] = defaultdict(int)
        self.endpoint_latencies: Dict[str, List[float]] = defaultdict(list)
        self.endpoint_counts: Dict[str, int] = defaultdict(int)

        # ML & Forecast specific metrics
        self.forecast_total: int = 0
        self.forecast_success: int = 0
        self.forecast_failed: int = 0
        self.forecast_ood_count: int = 0
        self.inference_latencies_ms: List[float] = []
        self.model_version_counts: Dict[str, int] = defaultdict(int)

        # Ingestion metrics cache
        self.last_ingestion_summary: Optional[Dict[str, Any]] = None

    def record_request(self, endpoint: str, status_code: int, duration_ms: float):
        self.request_count += 1
        status_bucket = f"{status_code // 100}xx"
        self.status_counts[status_bucket] += 1
        self.status_counts[str(status_code)] += 1
        self.endpoint_counts[endpoint] += 1

        # Keep rolling window of last 500 latencies per endpoint to prevent memory bloat
        lat_list = self.endpoint_latencies[endpoint]
        lat_list.append(duration_ms)
        if len(lat_list) > 500:
            lat_list.pop(0)

    def record_forecast(self, model_version: str, is_ood: bool, latency_ms: float, success: bool = True):
        self.forecast_total += 1
        if success:
            self.forecast_success += 1
        else:
            self.forecast_failed += 1

        if is_ood:
            self.forecast_ood_count += 1

        self.model_version_counts[model_version] += 1
        self.inference_latencies_ms.append(latency_ms)
        if len(self.inference_latencies_ms) > 1000:
            self.inference_latencies_ms.pop(0)

    def record_ingestion_run(self, summary: Dict[str, Any]):
        self.last_ingestion_summary = summary

    def get_summary(self) -> Dict[str, Any]:
        avg_lat = (
            sum(self.inference_latencies_ms) / len(self.inference_latencies_ms)
            if self.inference_latencies_ms
            else 0.0
        )
        return {
            "total_requests": self.request_count,
            "status_distribution": dict(self.status_counts),
            "endpoint_traffic": dict(self.endpoint_counts),
            "forecast_telemetry": {
                "total_forecasts": self.forecast_total,
                "successful_forecasts": self.forecast_success,
                "failed_forecasts": self.forecast_failed,
                "out_of_domain_count": self.forecast_ood_count,
                "avg_inference_latency_ms": round(avg_lat, 2),
                "model_usage_by_version": dict(self.model_version_counts),
            },
            "last_ingestion_run": self.last_ingestion_summary,
        }


# Global metrics instance
metrics_collector = MetricsCollector()


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """
    Injects or propagates correlation request IDs (X-Request-ID) across all API calls,
    records execution latency, and produces structured operational telemetry logs.
    """

    async def dispatch(self, request: Request, call_next):
        req_id = request.headers.get("X-Request-ID") or f"req_{uuid.uuid4().hex[:12]}"
        request.state.request_id = req_id

        start_time = time.perf_counter()
        response: Response = await call_next(request)
        duration_ms = (time.perf_counter() - start_time) * 1000

        response.headers["X-Request-ID"] = req_id

        # Record metrics (strip query parameters for clean grouping)
        clean_path = request.url.path
        metrics_collector.record_request(
            endpoint=f"{request.method} {clean_path}",
            status_code=response.status_code,
            duration_ms=duration_ms,
        )

        # Structured operational log
        log_payload = {
            "event": "http_request",
            "request_id": req_id,
            "method": request.method,
            "path": clean_path,
            "status_code": response.status_code,
            "duration_ms": round(duration_ms, 2),
        }
        if response.status_code >= 400:
            logger.warning(json.dumps(log_payload))
        else:
            logger.info(json.dumps(log_payload))

        return response
