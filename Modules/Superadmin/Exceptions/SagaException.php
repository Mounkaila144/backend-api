<?php

namespace Modules\Superadmin\Exceptions;

use Exception;

class SagaException extends Exception
{
    public function __construct(
        string $message,
        public string $failedStep = '',
        public array $completedSteps = [],
        public bool $compensated = true
    ) {
        parent::__construct($message);
    }

    public static function stepFailed(string $step, string $reason, array $completedSteps): self
    {
        return new self(
            message: "Saga failed at step '{$step}': {$reason}",
            failedStep: $step,
            completedSteps: $completedSteps
        );
    }

    public function context(): array
    {
        return [
            'failed_step' => $this->failedStep,
            'completed_steps' => $this->completedSteps,
            'compensated' => $this->compensated,
        ];
    }
}
