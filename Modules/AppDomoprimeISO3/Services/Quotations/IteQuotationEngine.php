<?php

namespace Modules\AppDomoprimeISO3\Services\Quotations;

use Modules\CustomersContracts\Entities\CustomerContract;
use Modules\CustomersMeetings\Entities\CustomerMeeting;

class IteQuotationEngine extends AbstractQuotationEngine
{
    public const TYPE = 'ITE';

    protected const DEFAULT_TVA_RATE = 5.5;

    private ?IteCumacContext $cachedContext = null;
    private ?string $cachedParentKey = null;
    private ?float $cachedSurface = null;

    public function __construct(private readonly IteCumacResolver $resolver = new IteCumacResolver())
    {
    }

    public function type(): string
    {
        return self::TYPE;
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     */
    protected function computeCumac(CustomerContract|CustomerMeeting $parent, array $items): float
    {
        $context = $this->resolveContext($parent, $items);

        return $context?->cumac() ?? 0.0;
    }

    protected function computeCeePrime(CustomerContract|CustomerMeeting $parent, float $cumac): float
    {
        if ($this->cachedContext === null || $cumac <= 0) {
            return 0.0;
        }

        return round($cumac * $this->cachedContext->polluterEurPerKwhCumac, 2);
    }

    /**
     * Symfony "Automatic subvention" panel:
     *   ite_prime = surface_ite * polluter_pricing.price
     *   ana_prime = -ite_prime  (they cancel — DomoprimeQuotation::getTotalSaleWith
     *               ITEPrimeAndAnaPrimeAndDiscount nets them out)
     *
     * @param  array<int, array<string, mixed>>  $items
     * @return array{0: float, 1: float}  [ceeAuto, anaAuto]
     */
    protected function computeAutoPrimes(CustomerContract|CustomerMeeting $parent, array $items): array
    {
        $request = $this->resolver->customerRequest($parent);
        $surfaceIte = (int) ($request?->surface_ite ?? 0);

        // Ensure context is resolved so we can read polluterEurPerKwhCumac.
        $this->resolveContext($parent, $items);
        $polluterUnitPrice = $this->cachedContext?->polluterEurPerKwhCumac ?? 0.0;

        if ($surfaceIte <= 0 || $polluterUnitPrice <= 0) {
            return [0.0, 0.0];
        }

        $itePrime = round($surfaceIte * $polluterUnitPrice, 2);
        return [$itePrime, -$itePrime];
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     */
    private function resolveContext(CustomerContract|CustomerMeeting $parent, array $items): ?IteCumacContext
    {
        $surface = 0.0;
        foreach ($items as $line) {
            $surface += (float) ($line['quantity'] ?? 0);
        }

        $parentKey = ($parent instanceof CustomerContract ? 'C' : 'M').':'.(int) $parent->getKey();
        if ($this->cachedContext !== null
            && $this->cachedParentKey === $parentKey
            && $this->cachedSurface === $surface) {
            return $this->cachedContext;
        }

        $this->cachedParentKey = $parentKey;
        $this->cachedSurface = $surface;
        $this->cachedContext = $this->resolver->resolve($parent, $surface);

        return $this->cachedContext;
    }
}
