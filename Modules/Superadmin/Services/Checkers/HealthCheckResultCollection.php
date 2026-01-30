<?php

namespace Modules\Superadmin\Services\Checkers;

use Illuminate\Contracts\Support\Arrayable;

class HealthCheckResultCollection implements Arrayable
{
    protected string $overallStatus;

    public function __construct(
        protected array $results,
        protected float $totalTimeMs
    ) {
        $this->overallStatus = $this->calculateOverallStatus();
    }

    protected function calculateOverallStatus(): string
    {
        $hasUnhealthy = false;
        $hasDegraded = false;

        foreach ($this->results as $result) {
            if (!$result->healthy) {
                $hasUnhealthy = true;
            } elseif (method_exists($result, 'isDegraded') && $result->isDegraded()) {
                $hasDegraded = true;
            }
        }

        if ($hasUnhealthy) {
            return 'unhealthy';
        }

        if ($hasDegraded) {
            return 'degraded';
        }

        return 'healthy';
    }

    public function getOverallStatus(): string
    {
        return $this->overallStatus;
    }

    public function getResults(): array
    {
        return $this->results;
    }

    public function toArray(): array
    {
        return [
            'overallStatus' => $this->overallStatus,
            'checkedAt' => now()->toIso8601String(),
            'totalTimeMs' => round($this->totalTimeMs, 2),
            'services' => array_map(
                fn (HealthCheckResult $result) => $result->toArray(),
                $this->results
            ),
        ];
    }
}
