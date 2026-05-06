<?php

namespace Modules\AppDomoprimeISO3\Services\Quotations;

class IteCumacContext
{
    public function __construct(
        public readonly int $classId,
        public readonly int $sectorId,
        public readonly int $regionId,
        public readonly int $energyId,
        public readonly int $polluterPriceId,
        public readonly float $polluterEurPerKwhCumac,
        public readonly float $surfaceCoef,
        public readonly float $surface,
    ) {
    }

    public function cumac(): float
    {
        return round($this->surface * $this->surfaceCoef, 3);
    }

    public function ceePrime(): float
    {
        return round($this->cumac() * $this->polluterEurPerKwhCumac, 2);
    }
}
