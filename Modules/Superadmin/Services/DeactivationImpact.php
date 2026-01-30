<?php

namespace Modules\Superadmin\Services;

class DeactivationImpact
{
    public function __construct(
        public string $moduleName,
        public int $tenantId,
        public int $fileCount,
        public int $totalSizeBytes,
        public bool $canDeactivate,
        public array $blockingModules,
        public bool $hasConfig,
        public array $warnings
    ) {}

    public function toArray(): array
    {
        return [
            'module_name' => $this->moduleName,
            'tenant_id' => $this->tenantId,
            'file_count' => $this->fileCount,
            'total_size_bytes' => $this->totalSizeBytes,
            'total_size_human' => $this->formatBytes($this->totalSizeBytes),
            'can_deactivate' => $this->canDeactivate,
            'blocking_modules' => $this->blockingModules,
            'has_config' => $this->hasConfig,
            'warnings' => $this->warnings,
        ];
    }

    protected function formatBytes(int $bytes): string
    {
        if ($bytes === 0) {
            return '0 B';
        }

        $units = ['B', 'KB', 'MB', 'GB'];
        $i = floor(log($bytes, 1024));
        return round($bytes / pow(1024, $i), 2) . ' ' . $units[$i];
    }
}
