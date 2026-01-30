<?php

namespace Modules\Superadmin\Health\Checks;

use Modules\Superadmin\Services\Checkers\ResendHealthChecker;
use Spatie\Health\Checks\Check;
use Spatie\Health\Checks\Result;

class ResendCheck extends Check
{
    public function run(): Result
    {
        $checker = app(ResendHealthChecker::class);
        $checkResult = $checker->check();

        if ($checkResult->healthy) {
            return Result::make()
                ->ok($checkResult->message)
                ->meta([
                    'latencyMs' => $checkResult->latencyMs,
                    'from_address' => $checkResult->details['from_address'] ?? null,
                ]);
        }

        return Result::make()
            ->failed($checkResult->message)
            ->meta([
                'error' => $checkResult->details['error'] ?? null,
            ]);
    }
}
