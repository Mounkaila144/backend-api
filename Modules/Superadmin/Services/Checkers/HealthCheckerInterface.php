<?php

namespace Modules\Superadmin\Services\Checkers;

interface HealthCheckerInterface
{
    public function check(?array $config = null): HealthCheckResult;
}
