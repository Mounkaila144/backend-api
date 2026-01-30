<?php

namespace Modules\Superadmin\Traits;

use Illuminate\Support\Facades\Log;

trait LogsSuperadminActivity
{
    /**
     * Champs sensibles à ne jamais logger
     */
    protected static array $sensitiveLogFields = [
        'password',
        'secret_key',
        'aws_secret_key',
        'api_key',
        'master_key',
        'token',
    ];

    /**
     * Log une activité SuperAdmin en filtrant les données sensibles
     */
    protected function logSuperadmin(string $level, string $message, array $context = []): void
    {
        $safeContext = $this->filterSensitiveData($context);
        Log::channel('superadmin')->{$level}($message, $safeContext);
    }

    /**
     * Filtre les données sensibles du context
     */
    protected function filterSensitiveData(array $data): array
    {
        foreach ($data as $key => $value) {
            if (in_array(strtolower($key), static::$sensitiveLogFields)) {
                $data[$key] = '[REDACTED]';
            } elseif (is_array($value)) {
                $data[$key] = $this->filterSensitiveData($value);
            }
        }
        return $data;
    }

    /**
     * Raccourcis pour les niveaux de log
     */
    protected function logInfo(string $message, array $context = []): void
    {
        $this->logSuperadmin('info', $message, $context);
    }

    protected function logWarning(string $message, array $context = []): void
    {
        $this->logSuperadmin('warning', $message, $context);
    }

    protected function logError(string $message, array $context = []): void
    {
        $this->logSuperadmin('error', $message, $context);
    }
}
