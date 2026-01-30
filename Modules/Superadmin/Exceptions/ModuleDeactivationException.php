<?php

namespace Modules\Superadmin\Exceptions;

use Exception;
use Throwable;

class ModuleDeactivationException extends Exception
{
    public function __construct(
        string $message,
        public string $module = '',
        public int $tenantId = 0,
        public array $blockingModules = [],
        ?Throwable $previous = null
    ) {
        parent::__construct($message, 0, $previous);
    }

    public static function notActive(string $module, int $tenantId): self
    {
        return new self("Module '{$module}' is not active for tenant {$tenantId}", $module, $tenantId);
    }

    public static function hasBlockingDependents(string $module, array $dependents): self
    {
        $list = implode(', ', $dependents);
        return new self(
            "Cannot deactivate '{$module}': blocking modules are active: {$list}",
            $module,
            blockingModules: $dependents
        );
    }

    public static function sagaFailed(string $module, int $tenantId, SagaException $e): self
    {
        return new self(
            "Module deactivation failed: {$e->getMessage()}",
            $module,
            $tenantId,
            previous: $e
        );
    }

    public function context(): array
    {
        return [
            'module' => $this->module,
            'tenant_id' => $this->tenantId,
            'blocking_modules' => $this->blockingModules,
        ];
    }
}
