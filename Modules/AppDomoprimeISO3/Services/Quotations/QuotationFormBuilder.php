<?php

namespace Modules\AppDomoprimeISO3\Services\Quotations;

use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Modules\AppDomoprime\Entities\DomoprimeSubventionType;
use Modules\CustomersContracts\Entities\CustomerContract;
use Modules\CustomersMeetings\Entities\CustomerMeeting;
use Modules\Product\Entities\Product;
use Modules\Product\Entities\ProductItem;

class QuotationFormBuilder
{
    public function __construct(
        private readonly QuotationTypeProductsResolver $productsResolver = new QuotationTypeProductsResolver(),
        private readonly IteCumacResolver $iteCumacResolver = new IteCumacResolver(),
    ) {
    }

    /**
     * @param  CustomerContract|CustomerMeeting  $parent
     * @param  ?object  $user  Authenticated user (must expose hasCredential()) — null = no gating (admin context)
     */
    public function build(CustomerContract|CustomerMeeting $parent, string $mode = 'standard', ?object $user = null): array
    {
        $polluter = $parent->getRelationValue('polluter');
        $type = strtoupper((string) ($polluter?->type ?? ''));
        $polluterId = (int) ($polluter?->getKey() ?? 0);

        $categories = $type !== '' ? $this->productCategories($type, $polluterId) : [];

        // Symfony parity: the master price override (DomoprimeQuotationPricingContractEngine)
        // is only triggered when the user has `superadmin` OR
        // `app_domprime_iso3_contract_quotation_new_config` (cf. AppDomoprimeIso3Events::
        // setProductMasterItemPricingForNewQuotationContract). Without it, master items
        // keep their raw t_products_item.sale_price.
        if ($type === 'ITE' && $this->canOverrideMasterPrice($user)) {
            $categories = $this->applyIteMasterPriceOverride($parent, $categories);
        }

        // Symfony parity: every item's default quantity = getITESurface() = intval(surface_ite)
        // (cf. DomoprimeQuotationITENew3ForContractForm::configure). Applied to ALL items —
        // master AND others — not just is_parent ones.
        if ($type === 'ITE') {
            $categories = $this->applyIteDefaultQuantity($parent, $categories);
        }

        $permissions = $this->resolvePermissions($parent, $user);

        return [
            'parent_type' => $parent instanceof CustomerContract ? 'contract' : 'meeting',
            'parent' => [
                'id' => $parent->getKey(),
                'reference' => $parent instanceof CustomerContract
                    ? (string) ($parent->reference ?? '')
                    : (string) ($parent->registration ?? ''),
            ],
            // Back-compat: keep `contract` key when parent is a contract so existing
            // frontend code (CreateQuotationDialog) continues to find it.
            'contract' => $parent instanceof CustomerContract ? [
                'id' => $parent->getKey(),
                'reference' => $parent->reference,
            ] : null,
            'meeting' => $parent instanceof CustomerMeeting ? [
                'id' => $parent->getKey(),
                'reference' => (string) ($parent->registration ?? ''),
            ] : null,
            'polluter' => [
                'id' => $polluter?->getKey(),
                'name' => $polluter?->name,
                'commercial' => $polluter?->commercial,
                'type' => $type,
            ],
            'mode' => $mode,
            'quantity_kind' => $this->quantityKind($type),
            'defaults' => [
                'dated_at' => $this->resolveDefaultDatedAt($parent),
                'discount_amount' => 0,
                'subvention_type_id' => null,
            ],
            'permissions' => $permissions,
            'subvention_types' => $permissions['can_set_subvention_type'] ? $this->subventionTypes() : [],
            'product_categories' => $categories,
            'product_selector_options' => $this->productSelectorOptions($categories),
        ];
    }

    /**
     * Mirror Symfony AppDomoprimeIso3Events::setProductMasterItemPricingForNewQuotationContract
     * permission gate: the engine override only runs for users in `superadmin` or
     * `app_domprime_iso3_contract_quotation_new_config`. Other users see the raw
     * t_products_item.sale_price.
     *
     * Defaults to true when no user is provided (CLI / unit-test contexts).
     */
    private function canOverrideMasterPrice(?object $user): bool
    {
        if ($user === null || ! method_exists($user, 'hasCredential')) {
            return true;
        }

        return (bool) $user->hasCredential([['superadmin', 'app_domprime_iso3_contract_quotation_new_config']]);
    }

    /**
     * Symfony parity: ITE form pre-fills every item's quantity with the
     * customer request surface_ite (intval). When the request is missing
     * or surface_ite is 0, falls back to 1 (current default).
     *
     * @param  array<int, array<string, mixed>>  $categories
     * @return array<int, array<string, mixed>>
     */
    private function applyIteDefaultQuantity(CustomerContract|CustomerMeeting $parent, array $categories): array
    {
        try {
            $request = $this->iteCumacResolver->customerRequest($parent);
        } catch (\Throwable) {
            $request = null;
        }

        $surfaceIte = (int) ($request?->surface_ite ?? 0);
        if ($surfaceIte <= 0) {
            return $categories;
        }

        foreach ($categories as &$category) {
            foreach ($category['items'] as &$item) {
                $item['default_quantity'] = $surfaceIte;
            }
            unset($item);
        }
        unset($category);

        return $categories;
    }

    /**
     * Symfony override (DomoprimeQuotationPricingContractEngine::process):
     * for every ITE master item, replace t_products_item.sale_price with
     * the dynamically-computed HT price (surface_coef / TVA factor).
     *
     * @param  array<int, array<string, mixed>>  $categories
     * @return array<int, array<string, mixed>>
     */
    private function applyIteMasterPriceOverride(CustomerContract|CustomerMeeting $parent, array $categories): array
    {
        try {
            $masterPriceHt = $this->iteCumacResolver->resolveMasterPriceHt($parent);
        } catch (\Throwable) {
            $masterPriceHt = null;
        }

        if ($masterPriceHt === null) {
            return $categories;
        }

        foreach ($categories as &$category) {
            foreach ($category['items'] as &$item) {
                if (! empty($item['is_parent'])) {
                    $item['default_price'] = $masterPriceHt;
                }
            }
            unset($item);
        }
        unset($category);

        return $categories;
    }

    /**
     * Mirror Symfony per-field credential gating. When $user is null (e.g. unit
     * tests, internal callers) every gate defaults to true.
     *
     * Credential names follow the convention
     *   app_domoprime_iso3_<parent>_view_quotation_new_<field>
     * with <parent> being either `contract` or `meeting`.
     *
     * @return array<string, bool>
     */
    private function resolvePermissions(CustomerContract|CustomerMeeting $parent, ?object $user): array
    {
        // Symfony names the form-field credentials per parent (contract /
        // meeting). Until the meeting-side credentials are seeded we accept
        // either name — admins keep their access to the field instead of
        // silently hiding it.
        $can = function (string $field) use ($user): bool {
            if ($user === null || ! method_exists($user, 'hasCredential')) {
                return true;
            }
            $credentials = [
                'app_domoprime_iso3_contract_view_quotation_new_'.$field,
                'app_domoprime_iso3_meeting_view_quotation_new_'.$field,
            ];
            return (bool) $user->hasCredential([$credentials]);
        };

        return [
            'can_set_dated_at' => $can('dated_at'),
            'can_set_subvention_type' => $can('subvention_type'),
            'can_set_discount_amount' => $can('discount_amount'),
        ];
    }

    private function resolveDefaultDatedAt(CustomerContract|CustomerMeeting $parent): ?string
    {
        if ($parent instanceof CustomerContract) {
            return $this->formatDate($parent->quoted_at ?? null);
        }

        // Meeting has no `quoted_at` — fall back to today (Symfony Form
        // configure() defaults to date('Y-m-d') when the meeting hasn't
        // been quoted yet).
        return $this->formatDate(now());
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function productCategories(string $polluterType, int $polluterId): array
    {
        $productIds = $this->productsResolver->resolve($polluterType, $polluterId);

        if (empty($productIds)) {
            return [];
        }

        $products = Product::query()
            ->whereIn('id', $productIds)
            ->where('status', 'ACTIVE')
            ->where('is_active', 'YES')
            ->orderBy('reference')
            ->get();

        if ($products->isEmpty()) {
            return [];
        }

        // Symfony only filters t_products by is_active/status — items themselves
        // are returned regardless (cf. ProductUtilsBase::getProductsAndItemsWithMasterByPositionFromSelection).
        // Without this, master items with sub_items flagged is_active='NO' (e.g. id=5
        // KNAUF TP238 / id=6 URSA PRK32) disappear and the form looks empty.
        // ORDER BY mirrors Symfony exactly: enum is_active (YES=1 before NO=2),
        // then alphabetical reference. So TERRADALL (YES) appears before KNAUF/URSA (NO).
        $items = ProductItem::query()
            ->whereIn('product_id', $products->pluck('id'))
            ->where('status', 'ACTIVE')
            ->orderBy('is_active')
            ->orderBy('reference')
            ->get();

        $itemIds = $items->pluck('id')->all();
        $subItemsByMaster = $this->loadSubItems($itemIds);

        $itemsByProduct = $items->groupBy(fn ($item) => (int) $item->product_id);

        return $products
            ->map(fn (Product $product) => [
                'id' => (int) $product->id,
                'reference' => $product->reference,
                'title' => $product->meta_title ?: $product->reference,
                'unit' => $product->unit,
                'items' => $this->mapItems(
                    $itemsByProduct->get((int) $product->id, collect()),
                    $subItemsByMaster
                ),
            ])
            ->values()
            ->all();
    }

    /**
     * @param  array<int, int>  $itemIds
     * @return array<int, array<int, array<string, mixed>>>
     */
    private function loadSubItems(array $itemIds): array
    {
        if (empty($itemIds)) {
            return [];
        }

        $rows = DB::connection('tenant')
            ->table('t_products_items_item')
            ->whereIn('item_master_id', $itemIds)
            ->where('is_active', 'YES')
            ->where('status', 'ACTIVE')
            ->get(['item_master_id', 'item_slave_id']);

        $byMaster = [];
        foreach ($rows as $row) {
            $masterId = (int) $row->item_master_id;
            $byMaster[$masterId][] = [
                'id' => (int) $row->item_slave_id,
                'is_default' => true,
            ];
        }

        return $byMaster;
    }

    /**
     * @param  Collection<int, ProductItem>  $items
     * @param  array<int, array<int, array<string, mixed>>>  $subItemsByMaster
     * @return array<int, array<string, mixed>>
     */
    private function mapItems(Collection $items, array $subItemsByMaster): array
    {
        return $items
            ->map(function (ProductItem $item) use ($subItemsByMaster) {
                $subItems = $subItemsByMaster[(int) $item->id] ?? [];

                return [
                    'id' => (int) $item->id,
                    'name' => $item->reference ?: $item->description,
                    'description' => $item->description,
                    'unit' => $item->unit,
                    'default_price' => (float) $item->sale_price,
                    'default_quantity' => 1,
                    'is_default_checked' => false,
                    'is_parent' => ! empty($subItems),
                    'sub_items' => $subItems,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Build the "Choisissez le produit" dropdown.
     * Symfony only lists items that are master (i.e. have at least one sub-item
     * via t_products_items_item.item_master_id). is_parent already encodes that.
     *
     * @param  array<int, array<string, mixed>>  $categories
     * @return array<int, array<string, mixed>>
     */
    private function productSelectorOptions(array $categories): array
    {
        $options = [];

        foreach ($categories as $category) {
            $reference = (string) ($category['reference'] ?? '');
            foreach ($category['items'] as $item) {
                if (empty($item['sub_items'])) {
                    continue;
                }

                $options[] = [
                    'id' => (int) $item['id'],
                    'product_id' => (int) $category['id'],
                    'label' => trim($reference.'_'.($item['name'] ?? ''), '_'),
                    'sub_items' => $item['sub_items'],
                ];
            }
        }

        return $options;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function subventionTypes(): array
    {
        try {
            return DomoprimeSubventionType::query()
                ->orderBy('id')
                ->get(['id', 'name', 'commercial'])
                ->map(fn (DomoprimeSubventionType $type) => [
                    'id' => (int) $type->id,
                    // Symfony quirk: `name` holds the human label ("DEVIS CEE"),
                    // `commercial` holds the technical slug ("calcule_prime_cee").
                    'name' => $type->name,
                    'commercial' => $type->commercial,
                    'value' => $type->name ?: $type->commercial,
                ])
                ->values()
                ->all();
        } catch (\Throwable) {
            return [];
        }
    }

    private function quantityKind(string $type): string
    {
        return in_array($type, ['ITE', 'TYPE1', 'TYPE2'], true) ? 'surface_m2' : 'quantity';
    }

    private function formatDate(mixed $date): ?string
    {
        if ($date instanceof CarbonInterface) {
            return $date->toDateString();
        }

        return $date ? (string) $date : null;
    }
}
