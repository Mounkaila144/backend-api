<?php

namespace Modules\Superadmin\Health\Checks;

use Modules\Superadmin\Services\Checkers\S3HealthChecker;
use Spatie\Health\Checks\Check;
use Spatie\Health\Checks\Result;

class S3Check extends Check
{
    public function run(): Result
    {
        $checker = app(S3HealthChecker::class);
        $checkResult = $checker->check();

        if ($checkResult->healthy) {
            return Result::make()
                ->ok($checkResult->message)
                ->meta([
                    'latencyMs' => $checkResult->latencyMs,
                    'bucket' => $checkResult->details['bucket'] ?? null,
                ]);
        }

        return Result::make()
            ->failed($checkResult->message)
            ->meta([
                'latencyMs' => $checkResult->latencyMs,
            ]);
    }
}
