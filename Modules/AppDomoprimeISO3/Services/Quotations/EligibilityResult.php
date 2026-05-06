<?php

namespace Modules\AppDomoprimeISO3\Services\Quotations;

class EligibilityResult
{
    public function __construct(
        public readonly bool $eligible,
        public readonly array $errors = []
    ) {
    }
}
