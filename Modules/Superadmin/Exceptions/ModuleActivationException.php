<?php

namespace Modules\Superadmin\Exceptions;

use Exception;
use Throwable;

class ModuleActivationException extends Exception
{
    public function __construct(
        string $message,
        public string $module = '',
        public int $tenantId = 0,
        public array $completedSteps = [],
        ?Throwable $previous = null
    ) {
        parent::__construct($message, 0, $previous);
    }

    public static function moduleNotActivatable(string $module): self
    {
        return new self("Module '{$module}' is not activatable", $module);
    }

    public static function missingDependencies(string $module, array $missing): self
    {
        $list = implode(', ', $missing);
        return new self("Module '{$module}' requires: {$list}", $module);
    }

    public static function alreadyActive(string $module, int $tenantId): self
    {
        return new self("Module '{$module}' is already active for tenant {$tenantId}", $module, $tenantId);
    }

    public static function sagaFailed(string $module, int $tenantId, SagaException $e): self
    {
        return new self(
            "Module activation failed: {$e->getMessage()}",
            $module,
            $tenantId,
            $e->completedSteps,
            $e
        );
    }

    public function context(): array
    {
        return [
            'module' => $this->module,
            'tenant_id' => $this->tenantId,
            'completed_steps' => $this->completedSteps,
        ];
    }
}
