<?php

namespace Modules\Superadmin\Health\Checks;

use Modules\Superadmin\Services\Checkers\MeilisearchHealthChecker;
use Spatie\Health\Checks\Check;
use Spatie\Health\Checks\Result;

class MeilisearchCheck extends Check
{
    public function run(): Result
    {
        $checker = app(MeilisearchHealthChecker::class);
        $checkResult = $checker->check();

        if ($checkResult->healthy) {
            return Result::make()
                ->ok($checkResult->message)
                ->meta([
                    'latencyMs' => $checkResult->latencyMs,
                    'version' => $checkResult->details['version'] ?? null,
                ]);
        }

        return Result::make()
            ->failed($checkResult->message)
            ->meta([
                'latencyMs' => $checkResult->latencyMs,
            ]);
    }
}
