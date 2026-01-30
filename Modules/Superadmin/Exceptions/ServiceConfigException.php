<?php

namespace Modules\Superadmin\Exceptions;

use Exception;

class ServiceConfigException extends Exception
{
    public static function unknownService(string $service, array $available): self
    {
        $list = implode(', ', $available);
        return new self("Unknown service '{$service}'. Available: {$list}");
    }

    public static function missingFields(string $service, array $fields): self
    {
        $list = implode(', ', $fields);
        return new self("Missing required fields for '{$service}': {$list}");
    }

    public static function connectionFailed(string $service, string $reason): self
    {
        return new self("Connection to '{$service}' failed: {$reason}");
    }
}
