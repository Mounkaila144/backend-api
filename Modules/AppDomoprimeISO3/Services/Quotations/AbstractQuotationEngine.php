<?php

namespace Modules\AppDomoprimeISO3\Services\Quotations;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Modules\AppDomoprime\Entities\DomoprimeQuotation;
use Modules\AppDomoprime\Entities\DomoprimeQuotationProduct;
use Modules\AppDomoprime\Entities\DomoprimeQuotationProductItem;
use Modules\AppDomoprimeISO3\Services\Quotations\Contracts\QuotationEngineInterface;
use Modules\CustomersContracts\Entities\CustomerContract;
use Modules\Product\Entities\ProductItem;
use RuntimeException;

abstract class AbstractQuotationEngine implements QuotationEngineInterface
{
    protected const DEFAULT_TVA_RATE = 5.5;

    abstract public function type(): string;

    public function simulate(CustomerContract $contract, array $payload): array
    {
        $items = $this->resolveItems($payload);
        $tvaRate = $this->resolveTvaRate($payload);

        $totals = $this->aggregateTotals($items, $tvaRate);
        $cumac = $this->computeCumac($contract, $items);

        // Symfony "Automatic subvention" panel formulas (DomoprimeQuotation::getITEPrime
        // + ::getAnaPrime). For ITE: ite_prime = surface_ite * polluter_pricing.price.
        // ana_prime = -ite_prime so they cancel each other in the rest_in_charge
        // formula → reste = total_with_tax (matches Symfony).
        [$ceeAuto, $anaAuto] = $this->computeAutoPrimes($contract, $items);
        $discountAuto = 0.0;

        // Symfony "Manuel subvention" overrides: only the manually-checked values
        // contribute to rest_in_charge. Auto values are display-only ("Automatic
        // subvention" block). When no checkbox is ticked, the rest equals total TTC.
        $ceeChecked = (bool) ($payload['cee_prime_check'] ?? false);
        $anaChecked = (bool) ($payload['ana_prime_check'] ?? false);
        $discountChecked = (bool) ($payload['discount_check'] ?? false);

        $ceeEffective = $ceeChecked ? (float) ($payload['cee_prime'] ?? 0) : 0.0;
        $anaEffective = $anaChecked ? (float) ($payload['ana_prime'] ?? 0) : 0.0;
        $discountEffective = $discountChecked ? (float) ($payload['discount_amount'] ?? 0) : 0.0;

        // Symfony getTotalSaleWithITEPrimeAndAnaPrimeAndDiscount(): substracts the
        // auto ite_prime + auto ana_prime (which cancel) PLUS the manual checkbox-
        // gated values.
        $restInCharge = max(
            0.0,
            $totals['total_with_tax']
                - $ceeAuto - $anaAuto
                - $ceeEffective - $anaEffective - $discountEffective
        );

        return [
            'cumac' => $cumac,
            'cee_prime_auto' => round($ceeAuto, 2),
            'cee_prime_effective' => round($ceeEffective, 2),
            'ana_prime_auto' => round($anaAuto, 2),
            'ana_prime_effective' => round($anaEffective, 2),
            'discount_auto' => round($discountAuto, 2),
            'discount_effective' => round($discountEffective, 2),
            'total_without_tax' => $totals['total_without_tax'],
            'total_tax' => $totals['total_tax'],
            'total_with_tax' => $totals['total_with_tax'],
            'rest_in_charge' => round($restInCharge, 2),
            'tva_rate' => $tvaRate,
            // Back-compat aliases for the previous flat panel.
            'cee_prime' => round($ceeEffective, 2),
            'ana_prime' => round($anaEffective, 2),
            'prime_cee' => round($ceeEffective, 2),
            'items' => array_map(
                fn (array $line) => [
                    'item_id' => $line['item_id'],
                    'product_id' => $line['product_id'],
                    'name' => $line['name'],
                    'quantity' => $line['quantity'],
                    'price' => $line['price'],
                    'total_without_tax' => $line['total_without_tax'],
                    'total_with_tax' => $line['total_with_tax'],
                ],
                $items
            ),
        ];
    }

    public function create(CustomerContract $contract, array $payload, int $userId): DomoprimeQuotation
    {
        $items = $this->resolveItems($payload);

        if (empty($items)) {
            throw new RuntimeException('Aucun article selectionne');
        }

        $tvaRate = $this->resolveTvaRate($payload);
        $totals = $this->aggregateTotals($items, $tvaRate);
        $cumac = $this->computeCumac($contract, $items);
        $ceePrime = $this->computeCeePrime($contract, $cumac);
        $anaPrime = $this->computeAnaPrime($contract, $items);

        return DB::connection('tenant')->transaction(function () use (
            $contract, $payload, $userId, $items, $tvaRate, $totals, $cumac, $ceePrime, $anaPrime
        ) {
            $datedAt = $this->resolveDatedAt($payload, $contract);

            $quotation = new DomoprimeQuotation();
            $quotation->reference = '';
            $quotation->month = (int) $datedAt->format('m');
            $quotation->year = (int) $datedAt->format('Y');
            $quotation->dated_at = $datedAt;
            // ENUM('simple','multiple') — 'simple' = single quotation per contract,
            // 'multiple' = part of a multi-quotation set (not used here yet).
            $quotation->mode = 'simple';
            $quotation->type = strtoupper($this->type());
            $quotation->contract_id = $contract->id;
            $quotation->meeting_id = $contract->meeting_id;
            $quotation->customer_id = $contract->customer_id;
            $quotation->company_id = $contract->company_id;
            $quotation->polluter_id = $contract->polluter_id;
            $quotation->creator_id = $userId;
            $quotation->subvention_type_id = $payload['subvention_type_id'] ?? null;
            $quotation->discount_amount = (float) ($payload['discount_amount'] ?? 0);
            $quotation->status = 'ACTIVE';
            $quotation->is_signed = 'NO';
            $quotation->is_last = 'YES';
            $quotation->total_sale_without_tax = $totals['total_without_tax'];
            $quotation->total_sale_with_tax = $totals['total_with_tax'];
            $quotation->total_tax = $totals['total_tax'];
            $quotation->qmac_value = $cumac;
            $quotation->cee_prime = $ceePrime;
            $quotation->prime = $ceePrime;
            $quotation->ana_prime = $anaPrime;
            $quotation->rest_in_charge = max(0.0, $totals['total_with_tax'] - $ceePrime - $anaPrime);
            $quotation->engine = static::class;
            $quotation->save();

            $quotation->reference = sprintf('DEV-%d', $quotation->id);
            $quotation->save();

            DomoprimeQuotation::query()
                ->where('contract_id', $contract->id)
                ->where('id', '!=', $quotation->id)
                ->update(['is_last' => 'NO']);

            $this->persistItems($quotation, $items, $tvaRate);

            $contract->is_signed = 'NO';
            $contract->save();

            return $quotation->fresh(['products']);
        });
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<int, array<string, mixed>>
     */
    protected function resolveItems(array $payload): array
    {
        $rows = $payload['items'] ?? [];
        if (! is_array($rows) || empty($rows)) {
            return [];
        }

        $itemIds = collect($rows)
            ->pluck('item_id')
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        $products = empty($itemIds)
            ? collect()
            : ProductItem::query()->whereIn('id', $itemIds)->get()->keyBy('id');

        $resolved = [];
        foreach ($rows as $row) {
            $itemId = (int) ($row['item_id'] ?? 0);
            if ($itemId <= 0) {
                continue;
            }

            $quantity = max(0.0, (float) ($row['quantity'] ?? 0));
            $price = (float) ($row['price'] ?? 0);

            $product = $products->get($itemId);
            if ($product) {
                $price = $price > 0 ? $price : (float) $product->sale_price;
            }

            $totalWithoutTax = round($quantity * $price, 6);

            $resolved[] = [
                'item_id' => $itemId,
                'product_id' => (int) ($product->product_id ?? 0),
                'name' => $product?->reference ?? (string) ($row['name'] ?? ''),
                'description' => $product?->description ?? '',
                'unit' => $product?->unit ?? '',
                'tva_id' => (int) ($product?->tva_id ?? 0),
                'quantity' => $quantity,
                'price' => $price,
                'purchase_price' => (float) ($product?->purchasing_price ?? 0),
                'total_without_tax' => $totalWithoutTax,
                'total_with_tax' => 0.0, // computed in aggregateTotals
            ];
        }

        return $resolved;
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array{total_without_tax: float, total_tax: float, total_with_tax: float}
     */
    protected function aggregateTotals(array &$items, float $tvaRate): array
    {
        $totalWithoutTax = 0.0;
        $totalTax = 0.0;

        foreach ($items as &$line) {
            $line['total_without_tax'] = round($line['quantity'] * $line['price'], 6);
            $tax = round($line['total_without_tax'] * ($tvaRate / 100.0), 6);
            $line['total_tax'] = $tax;
            $line['total_with_tax'] = round($line['total_without_tax'] + $tax, 6);

            $totalWithoutTax += $line['total_without_tax'];
            $totalTax += $tax;
        }
        unset($line);

        $totalWithoutTax = round($totalWithoutTax, 6);
        $totalTax = round($totalTax, 6);

        return [
            'total_without_tax' => $totalWithoutTax,
            'total_tax' => $totalTax,
            'total_with_tax' => round($totalWithoutTax + $totalTax, 6),
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     */
    abstract protected function computeCumac(CustomerContract $contract, array $items): float;

    /**
     * Symfony "Automatic subvention" pair (ite_prime, ana_prime).
     * Default: both 0 (no auto subvention). ITE engine overrides to:
     *   ite_prime = surface_ite * polluter_pricing.price
     *   ana_prime = -ite_prime  (they cancel each other in Symfony's
     *               rest_in_charge formula → reste = total_with_tax by default)
     *
     * @param  array<int, array<string, mixed>>  $items
     * @return array{0: float, 1: float}  [ceeAuto, anaAuto]
     */
    protected function computeAutoPrimes(CustomerContract $contract, array $items): array
    {
        return [0.0, 0.0];
    }

    protected function computeCeePrime(CustomerContract $contract, float $cumac): float
    {
        // Default: no CEE prime when no pricing config is available.
        // Subclasses may override with full polluter pricing lookup.
        return 0.0;
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     */
    protected function computeAnaPrime(CustomerContract $contract, array $items): float
    {
        return 0.0;
    }

    protected function resolveTvaRate(array $payload): float
    {
        return isset($payload['tva_rate']) ? (float) $payload['tva_rate'] : static::DEFAULT_TVA_RATE;
    }

    protected function resolveDatedAt(array $payload, CustomerContract $contract): Carbon
    {
        $raw = $payload['dated_at'] ?? $contract->quoted_at ?? null;
        if ($raw instanceof Carbon) {
            return $raw->copy();
        }

        if ($raw) {
            try {
                return Carbon::parse((string) $raw);
            } catch (\Throwable) {
                // fall-through to today
            }
        }

        return Carbon::now();
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     */
    protected function persistItems(DomoprimeQuotation $quotation, array $items, float $tvaRate): void
    {
        $byProduct = [];
        foreach ($items as $line) {
            $byProduct[$line['product_id']][] = $line;
        }

        foreach ($byProduct as $productId => $lines) {
            $totalQty = 0.0;
            $totalWithoutTax = 0.0;
            $totalWithTax = 0.0;
            $totalPurchase = 0.0;

            foreach ($lines as $line) {
                $totalQty += $line['quantity'];
                $totalWithoutTax += $line['total_without_tax'];
                $totalWithTax += $line['total_with_tax'];
                $totalPurchase += $line['purchase_price'] * $line['quantity'];
            }

            $product = new DomoprimeQuotationProduct();
            $product->quotation_id = $quotation->id;
            $product->product_id = $productId;
            $product->title = (string) ($lines[0]['name'] ?? '');
            $product->entitled = (string) ($lines[0]['name'] ?? '');
            $product->meeting_id = (int) ($quotation->meeting_id ?? 0);
            $product->meeting_product_id = 0;
            $product->quantity = $totalQty;
            $product->tva_id = (int) ($lines[0]['tva_id'] ?? 0);
            $product->status = 'ACTIVE';
            $product->sale_price_without_tax = $lines[0]['price'];
            $product->sale_price_with_tax = round($lines[0]['price'] * (1 + $tvaRate / 100.0), 6);
            $product->total_sale_price_without_tax = $totalWithoutTax;
            $product->total_sale_price_with_tax = $totalWithTax;
            $product->purchase_price_without_tax = $lines[0]['purchase_price'];
            $product->purchase_price_with_tax = round($lines[0]['purchase_price'] * (1 + $tvaRate / 100.0), 6);
            $product->total_purchase_price_without_tax = $totalPurchase;
            $product->total_purchase_price_with_tax = round($totalPurchase * (1 + $tvaRate / 100.0), 6);
            $product->save();

            foreach ($lines as $line) {
                $item = new DomoprimeQuotationProductItem();
                $item->quotation_id = $quotation->id;
                $item->quotation_product_id = $product->id;
                $item->product_id = $productId;
                $item->product_item_id = $line['item_id'];
                $item->item_id = $line['item_id'];
                $item->title = $line['name'];
                $item->entitled = $line['name'];
                $item->description = $line['description'];
                $item->unit = $line['unit'];
                $item->quantity = $line['quantity'];
                $item->tva_id = $line['tva_id'];
                $item->status = 'ACTIVE';
                $item->is_master = 'NO';
                $item->is_mandatory = 'NO';
                $item->sale_price_without_tax = $line['price'];
                $item->sale_price_with_tax = round($line['price'] * (1 + $tvaRate / 100.0), 6);
                $item->total_sale_price_without_tax = $line['total_without_tax'];
                $item->total_sale_price_with_tax = $line['total_with_tax'];
                $item->total_tax = $line['total_tax'];
                $item->purchase_price_without_tax = $line['purchase_price'];
                $item->purchase_price_with_tax = round($line['purchase_price'] * (1 + $tvaRate / 100.0), 6);
                $item->total_purchase_price_without_tax = $line['purchase_price'] * $line['quantity'];
                $item->total_purchase_price_with_tax = round($line['purchase_price'] * $line['quantity'] * (1 + $tvaRate / 100.0), 6);
                $item->save();
            }
        }
    }
}
