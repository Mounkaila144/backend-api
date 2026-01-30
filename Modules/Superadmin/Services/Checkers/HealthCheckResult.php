<?php

namespace Modules\Superadmin\Services\Checkers;

class HealthCheckResult
{
    public function __construct(
        public string $service,
        public bool $healthy,
        public string $message,
        public array $details = [],
        public ?float $latencyMs = null
    ) {
    }

    public function isDegraded(): bool
    {
        if (!$this->healthy) {
            return false; // Unhealthy, not degraded
        }

        if ($this->latencyMs === null) {
            return false;
        }

        $thresholds = config("health-thresholds.latency.{$this->service}");

        if (!$thresholds) {
            return false;
        }

        // Si latence > seuil healthy mais <= seuil degraded
        return $this->latencyMs > $thresholds['healthy']
            && $this->latencyMs <= $thresholds['degraded'];
    }

    public function isHighLatency(): bool
    {
        if ($this->latencyMs === null) {
            return false;
        }

        $thresholds = config("health-thresholds.latency.{$this->service}");

        if (!$thresholds) {
            return false;
        }

        return $this->latencyMs > $thresholds['degraded'];
    }

    public function getStatus(): string
    {
        if (!$this->healthy) {
            return 'unhealthy';
        }

        if ($this->isDegraded() || $this->isHighLatency()) {
            return 'degraded';
        }

        return 'healthy';
    }

    public function toArray(): array
    {
        return [
            'service' => $this->service,
            'status' => $this->getStatus(),
            'healthy' => $this->healthy,
            'message' => $this->message,
            'details' => $this->details,
            'latencyMs' => $this->latencyMs ? round($this->latencyMs, 2) : null,
            'checkedAt' => now()->toIso8601String(),
        ];
    }
}
