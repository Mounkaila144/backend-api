<?php

namespace Modules\Superadmin\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HealthCheckResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'overallStatus' => $this->resource->getOverallStatus(),
            'checkedAt' => now()->toIso8601String(),
            'services' => collect($this->resource->getResults())->map(function ($result) {
                return [
                    'name' => $result->service,
                    'status' => $this->getStatus($result),
                    'latencyMs' => $result->latencyMs,
                    'message' => $result->message ?? null,
                ];
            })->values(),
        ];
    }

    protected function getStatus($result): string
    {
        if (!$result->healthy) {
            return 'unhealthy';
        }

        // Check if degraded based on latency (high latency = degraded)
        if ($result->latencyMs !== null && $result->latencyMs > 500) {
            return 'degraded';
        }

        return 'healthy';
    }
}
