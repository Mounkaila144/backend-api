<?php

namespace Modules\Superadmin\Services;

use Modules\Superadmin\Exceptions\SagaException;

class SagaOrchestrator
{
    protected array $steps = [];
    protected array $completedSteps = [];
    protected array $errors = [];
    protected array $stepDetails = [];

    /**
     * Ajoute une étape à la saga
     */
    public function addStep(string $name, callable $execute, callable $compensate): self
    {
        $this->steps[] = [
            'name' => $name,
            'execute' => $execute,
            'compensate' => $compensate,
        ];

        return $this;
    }

    /**
     * Exécute la saga complète
     */
    public function execute(): SagaResult
    {
        $this->completedSteps = [];
        $this->errors = [];
        $this->stepDetails = [];

        $startTime = microtime(true);

        foreach ($this->steps as $step) {
            try {
                $stepStart = microtime(true);
                $result = call_user_func($step['execute']);
                $stepDuration = (microtime(true) - $stepStart) * 1000;

                $this->completedSteps[] = [
                    'name' => $step['name'],
                    'result' => $result,
                    'compensate' => $step['compensate'],
                ];

                $this->stepDetails[] = [
                    'name' => $step['name'],
                    'duration_ms' => round($stepDuration, 2),
                    'result' => $result,
                ];
            } catch (\Exception $e) {
                $this->errors[] = [
                    'step' => $step['name'],
                    'error' => $e->getMessage(),
                ];

                // Compensation des étapes complétées
                $this->compensate();

                throw SagaException::stepFailed(
                    $step['name'],
                    $e->getMessage(),
                    array_column($this->completedSteps, 'name')
                );
            }
        }

        $totalDuration = (microtime(true) - $startTime) * 1000;

        return new SagaResult(
            success: true,
            completedSteps: array_column($this->completedSteps, 'name'),
            errors: [],
            durationMs: round($totalDuration, 2),
            stepDetails: $this->stepDetails
        );
    }

    /**
     * Exécute les compensations en ordre inverse
     */
    protected function compensate(): void
    {
        $stepsToCompensate = array_reverse($this->completedSteps);

        foreach ($stepsToCompensate as $step) {
            try {
                call_user_func($step['compensate']);
            } catch (\Exception $e) {
                // Log l'erreur de compensation mais continue
                $this->errors[] = [
                    'step' => $step['name'] . '_compensation',
                    'error' => $e->getMessage(),
                ];
            }
        }
    }

    /**
     * Réinitialise l'orchestrateur
     */
    public function reset(): self
    {
        $this->steps = [];
        $this->completedSteps = [];
        $this->errors = [];
        $this->stepDetails = [];

        return $this;
    }
}
