<?php

namespace Modules\Superadmin\Services;

class BatchResult
{
    public function __construct(
        public array $results
    ) {}

    public function toArray(): array
    {
        return [
            'success' => $this->results['success'] ?? [],
            'failed' => $this->results['failed'] ?? [],
            'skipped' => $this->results['skipped'] ?? [],
            'summary' => [
                'total' => count($this->results['success'] ?? []) + count($this->results['failed'] ?? []) + count($this->results['skipped'] ?? []),
                'success_count' => count($this->results['success'] ?? []),
                'failed_count' => count($this->results['failed'] ?? []),
                'skipped_count' => count($this->results['skipped'] ?? []),
            ],
        ];
    }
}
