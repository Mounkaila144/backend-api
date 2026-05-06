<?php

namespace Modules\AppDomoprimeISO3\Services\Quotations;

use Modules\AppDomoprimeISO3\Entities\QuotationTypeSettings;
use Modules\PartnerPolluter\Entities\PartnerPolluterProduct;

/**
 * Resolves the list of t_products.id eligible for a given polluter type
 * (ITE/BOILER/PACK/TYPE1/TYPE2).
 *
 * Source of truth: t_quotation_type_settings (mirror of the Symfony
 * DomoprimeIso3Settings .dat file). When the table has no row for the
 * type, falls back to the polluter↔product junction so legacy tenants
 * that have not been migrated still get a (broader) product list.
 */
class QuotationTypeProductsResolver
{
    /** @var array<string, array<int>> */
    private array $cache = [];

    /**
     * @return array<int, int>
     */
    public function resolve(string $polluterType, ?int $polluterId = null): array
    {
        $type = strtoupper(trim($polluterType));
        if ($type === '') {
            return [];
        }

        if (isset($this->cache[$type])) {
            return $this->cache[$type];
        }

        try {
            $row = QuotationTypeSettings::query()->where('polluter_type', $type)->first();
            if ($row && is_array($row->product_ids) && ! empty($row->product_ids)) {
                return $this->cache[$type] = array_values(array_unique(array_map('intval', $row->product_ids)));
            }
        } catch (\Throwable) {
            // No tenant connection (unit tests) or table missing — fall through to legacy.
        }

        if ($polluterId !== null && $polluterId > 0) {
            try {
                $ids = PartnerPolluterProduct::query()
                    ->where('polluter_id', $polluterId)
                    ->whereNotNull('product_id')
                    ->pluck('product_id')
                    ->map(fn ($id) => (int) $id)
                    ->unique()
                    ->values()
                    ->all();

                return $this->cache[$type] = $ids;
            } catch (\Throwable) {
                // ditto
            }
        }

        return $this->cache[$type] = [];
    }

    public function clearCache(): void
    {
        $this->cache = [];
    }
}
