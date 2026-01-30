<?php

namespace Modules\Superadmin\Services;

class SagaResult
{
    public function __construct(
        public bool $success,
        public array $completedSteps,
        public array $errors,
        public float $durationMs = 0,
        public array $stepDetails = []
    ) {}

    public function toArray(): array
    {
        return [
            'success' => $this->success,
            'completed_steps' => $this->completedSteps,
            'errors' => $this->errors,
            'duration_ms' => $this->durationMs,
            'step_details' => $this->stepDetails,
        ];
    }
}
