<?php

namespace Modules\Superadmin\Exceptions;

use Exception;

class StorageException extends Exception
{
    public static function creationFailed(string $path, string $reason): self
    {
        return new self("Failed to create storage structure at '{$path}': {$reason}");
    }

    public static function deletionFailed(string $path, string $reason): self
    {
        return new self("Failed to delete storage at '{$path}': {$reason}");
    }

    public static function backupFailed(string $path, string $reason): self
    {
        return new self("Failed to backup storage at '{$path}': {$reason}");
    }
}
