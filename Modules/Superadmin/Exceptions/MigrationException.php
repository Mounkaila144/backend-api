<?php

namespace Modules\Superadmin\Exceptions;

use Exception;

class MigrationException extends Exception
{
    public static function runFailed(string $module, int $tenantId, string $reason): self
    {
        return new self("Failed to run migrations for module '{$module}' on tenant {$tenantId}: {$reason}");
    }

    public static function rollbackFailed(string $module, int $tenantId, string $reason): self
    {
        return new self("Failed to rollback migrations for module '{$module}' on tenant {$tenantId}: {$reason}");
    }
}
