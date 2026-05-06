<?php

namespace Modules\AppDomoprimeISO3\Services\Documents;

use Carbon\Carbon as BaseCarbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Modules\AppDomoprime\Entities\DomoprimeCalculation;
use Modules\AppDomoprime\Entities\DomoprimeIsoCustomerRequest;
use Modules\AppDomoprime\Entities\DomoprimeQuotation;
use Modules\AppDomoprime\Entities\DomoprimeQuotationProduct;
use Modules\AppDomoprime\Entities\DomoprimeQuotationProductItem;
use Modules\AppDomoprime\Entities\DomoprimeSubventionType;
use Modules\AppDomoprimeISO3\Services\Quotations\QuotationReferenceGenerator;
use Modules\Customer\Entities\Customer;
use Modules\CustomersContracts\Entities\CustomerContract;
use Modules\CustomersContracts\Entities\CustomerContractCompany;
use Modules\PartnerPolluter\Entities\PartnerPolluterCompany;
use Modules\Product\Entities\ProductItem;
use Modules\Product\Entities\Tax;

/**
 * Builds the array of Smarty variables expected by the Symfony PDF templates
 * stored in t_domoprime_quotation_model_i18n.body.
 *
 * Mirrors Symfony's DomoprimeQuotationModelParameters::loadParametersForQuotation()
 * (modules/app_domoprime/common/lib/DomoprimeQuotation/DomoprimeQuotationModelParameters.class.php).
 */
class QuotationDataBuilder
{
    private array $itemCatalogCache = [];

    private array $taxRateCache = [];

    private ?array $siteCompanyCache = null;

    public function build(DomoprimeQuotation $quotation, string $lang = 'fr'): array
    {
        $this->ensureRelationsLoaded($quotation);

        $contract = $quotation->contract;
        $customer = $contract?->customer;
        $request = $contract?->domoprimeIsoRequest?->last();

        return [
            'lang' => $lang,
            'today' => $this->dateBundle(BaseCarbon::now()),
            'company' => $this->buildCompany($contract?->company),
            'polluter' => $this->buildPolluter($contract?->polluter),
            'customer' => $this->buildCustomer($customer),
            'contract' => $this->buildContract($contract, $request),
            'quotation' => $this->buildQuotation($quotation),
            'products' => $this->buildProducts($quotation),
            'items' => $this->flattenItems($quotation),
            'subvention_type' => $this->buildSubventionType($quotation->subventionType),
            'calculation' => $this->buildCalculation($quotation->calculation),
        ];
    }

    private function ensureRelationsLoaded(DomoprimeQuotation $quotation): void
    {
        $missing = array_filter(
            ['products', 'subventionType', 'calculation', 'contract'],
            fn (string $rel) => ! $quotation->relationLoaded($rel)
        );
        if ($missing) {
            $quotation->loadMissing([
                'products.items',
                'subventionType',
                'calculation',
                'contract.customer.addresses',
                'contract.polluter',
                'contract.company',
                'contract.domoprimeIsoRequest',
            ]);
        }
    }

    /**
     * Symfony pattern (DomoprimeQuotationModelParameters): start from
     * SiteCompanyUtils::getSiteCompany() (the tenant's t_site_company row),
     * then override with the contract's company if set.
     */
    private function buildCompany(?CustomerContractCompany $contractCompany): array
    {
        $base = $this->loadSiteCompany();
        if (! $contractCompany) {
            return $base;
        }

        return array_merge($base, [
            'id' => (int) $contractCompany->id,
            'name' => (string) ($contractCompany->name ?? $base['name']),
            'commercial' => (string) ($contractCompany->commercial ?? $contractCompany->name ?? $base['commercial']),
            'address1' => (string) ($contractCompany->address1 ?? $base['address1']),
            'address2' => (string) ($contractCompany->address2 ?? $base['address2']),
            'postcode' => (string) ($contractCompany->postcode ?? $base['postcode']),
            'city' => (string) ($contractCompany->city ?? $base['city']),
            'country' => (string) ($contractCompany->country ?? $base['country']),
            'phone' => (string) ($contractCompany->phone ?? $base['phone']),
            'mobile' => (string) ($contractCompany->mobile ?? $base['mobile']),
            'fax' => (string) ($contractCompany->fax ?? $base['fax']),
            'email' => (string) ($contractCompany->email ?? $base['email']),
            'web' => (string) ($contractCompany->web ?? $base['web']),
            'siret' => (string) ($contractCompany->siret ?? $base['siret']),
            'tva' => (string) ($contractCompany->tva ?? $base['tva']),
            'type' => (string) ($contractCompany->type ?? ''),
        ]);
    }

    private function loadSiteCompany(): array
    {
        if ($this->siteCompanyCache !== null) {
            return $this->siteCompanyCache;
        }

        try {
            $row = DB::connection('tenant')->table('t_site_company')->first();
        } catch (\Throwable) {
            $row = null;
        }

        if (! $row) {
            return $this->siteCompanyCache = $this->emptyCompany();
        }

        return $this->siteCompanyCache = [
            'id' => (int) ($row->id ?? 0),
            'name' => (string) ($row->name ?? ''),
            'commercial' => (string) ($row->commercial ?? $row->name ?? ''),
            'address1' => (string) ($row->address1 ?? ''),
            'address2' => (string) ($row->address2 ?? ''),
            'postcode' => (string) ($row->postcode ?? ''),
            'city' => (string) ($row->city ?? ''),
            'country' => (string) ($row->country ?? ''),
            'phone' => (string) ($row->phone ?? ''),
            'mobile' => (string) ($row->mobile ?? ''),
            'fax' => (string) ($row->fax ?? ''),
            'email' => (string) ($row->email ?? ''),
            'web' => (string) ($row->web ?? ''),
            'siret' => (string) ($row->siret ?? ''),
            'tva' => (string) ($row->tva ?? ''),
            'ape' => (string) ($row->ape ?? ''),
            'rcs' => (string) ($row->rcs ?? ''),
            'rge' => (string) ($row->rge ?? ''),
            'capital' => (string) ($row->capital ?? ''),
            'comments' => (string) ($row->comments ?? ''),
            'header' => (string) ($row->header ?? ''),
            'footer' => (string) ($row->footer ?? ''),
            'footer_text' => (string) ($row->footer_text ?? ''),
            'gender' => (string) ($row->gender ?? ''),
            'firstname' => (string) ($row->firstname ?? ''),
            'lastname' => (string) ($row->lastname ?? ''),
            'function' => (string) ($row->function ?? ''),
            'type' => '',
            'picture' => ['url' => (string) ($row->picture ?? '')],
        ];
    }

    private function buildPolluter(?PartnerPolluterCompany $polluter): array
    {
        if (! $polluter) {
            return [];
        }

        return [
            'id' => (int) $polluter->id,
            'name' => (string) ($polluter->name ?? ''),
            'commercial' => (string) ($polluter->commercial ?? $polluter->name ?? ''),
            'siret' => (string) ($polluter->siret ?? ''),
            'tva' => (string) ($polluter->tva ?? ''),
            'ape' => (string) ($polluter->ape ?? ''),
            'address1' => (string) ($polluter->address1 ?? ''),
            'address2' => (string) ($polluter->address2 ?? ''),
            'postcode' => (string) ($polluter->postcode ?? ''),
            'city' => (string) ($polluter->city ?? ''),
            'country' => (string) ($polluter->country ?? ''),
            'phone' => (string) ($polluter->phone ?? ''),
            'mobile' => (string) ($polluter->mobile ?? ''),
            'email' => (string) ($polluter->email ?? ''),
            'web' => (string) ($polluter->web ?? ''),
            'logo' => (string) ($polluter->logo ?? ''),
            'type' => (string) ($polluter->type ?? ''),
            // Used by templates: {eval $polluter.comments} renders the
            // legal "Termes et conditions" block (T-PNE / TotalEnergies / ...).
            'comments' => (string) ($polluter->comments ?? ''),
        ];
    }

    private function buildCustomer(?Customer $customer): array
    {
        if (! $customer) {
            return $this->emptyCustomer();
        }

        $address = $customer->relationLoaded('addresses')
            ? $customer->addresses->first(fn ($a) => ($a->status ?? null) === 'ACTIVE') ?? $customer->addresses->first()
            : null;

        return [
            'id' => (int) $customer->id,
            'firstname' => (string) ($customer->firstname ?? ''),
            'lastname' => (string) ($customer->lastname ?? ''),
            'civility' => (string) ($customer->gender ?? ''),
            'gender' => (string) ($customer->gender ?? ''),
            'birthday' => $this->formatDate($customer->birthday ?? null),
            'phone' => (string) ($customer->phone ?? ''),
            'phone1' => (string) ($customer->phone1 ?? ''),
            'mobile' => (string) ($customer->mobile ?? ''),
            'mobile2' => (string) ($customer->mobile2 ?? ''),
            'email' => (string) ($customer->email ?? ''),
            'company' => (string) ($customer->company ?? ''),
            'address' => [
                'address1' => (string) ($address->address1 ?? ''),
                'address2' => (string) ($address->address2 ?? ''),
                'postcode' => (string) ($address->postcode ?? ''),
                'city' => (string) ($address->city ?? ''),
                'country' => (string) ($address->country ?? ''),
                'state' => (string) ($address->state ?? ''),
            ],
        ];
    }

    private function buildContract(?CustomerContract $contract, ?DomoprimeIsoCustomerRequest $request): array
    {
        if (! $contract) {
            return [];
        }

        return [
            'id' => (int) $contract->id,
            'reference' => (string) ($contract->reference ?? ''),
            'created_at' => $this->dateBundle($contract->created_at ?? null),
            'updated_at' => $this->dateBundle($contract->updated_at ?? null),
            'opened_at' => $this->dateBundle($contract->opened_at ?? null),
            'quoted_at' => $this->dateBundle($contract->quoted_at ?? null),
            'quoted_at_30' => $this->dateBundle($this->shiftDate($contract->quoted_at ?? null, '+1 month')),
            'quoted_at_90' => $this->dateBundle($this->shiftDate($contract->quoted_at ?? null, '+90 days')),
            'billing_at' => $this->dateBundle($contract->billing_at ?? null),
            'payment_at' => $this->dateBundle($contract->payment_at ?? null),
            'opc_at' => $this->dateBundle($contract->opc_at ?? null),
            'sav_at' => $this->dateBundle($contract->sav_at ?? null),
            'pre_meeting_at' => $this->dateBundle($contract->pre_meeting_at ?? null),
            'is_hold' => (string) ($contract->is_hold ?? 'NO'),
            'is_hold_quote' => (string) ($contract->is_hold_quote ?? 'NO'),
            'is_signed' => (string) ($contract->is_signed ?? 'NO'),
            'request' => $this->buildRequest($request),
        ];
    }

    private function buildRequest(?DomoprimeIsoCustomerRequest $r): array
    {
        if (! $r) {
            return [];
        }

        return [
            'surface_home' => (string) ($r->surface_home ?? '0'),
            'surface_wall' => (string) ($r->surface_wall ?? '0'),
            'surface_top' => (string) ($r->surface_top ?? '0'),
            'surface_floor' => (string) ($r->surface_floor ?? '0'),
            'surface_ite' => (string) ($r->surface_ite ?? '0'),
            'revenue' => (string) ($r->revenue ?? '0'),
            'number_of_people' => (string) ($r->number_of_people ?? '0'),
            'number_of_children' => (string) ($r->number_of_children ?? '0'),
            'number_of_parts' => (string) ($r->number_of_parts ?? '0'),
            'declarants' => (string) ($r->declarants ?? ''),
            'pricing_id' => (int) ($r->pricing_id ?? 0),
            'energy_id' => (int) ($r->energy_id ?? 0),
            'occupation_id' => (int) ($r->occupation_id ?? 0),
            'more_2_years' => (string) ($r->more_2_years ?? 'NO'),
            'build_year' => (string) ($r->build_year ?? ''),
            'parcel_reference' => (string) ($r->parcel_reference ?? ''),
            'has_bbc' => (string) ($r->has_bbc ?? 'N'),
            'has_strainer' => (string) ($r->has_strainer ?? 'N'),
        ];
    }

    private function buildQuotation(DomoprimeQuotation $q): array
    {
        $values = $q->attributesToArray();

        // Map of raw column → formatted-getter alias. Symfony overwrites the
        // raw column value with the formatted version in toArrayForPdf(), so
        // the template can do {$quotation.total_sale_with_tax} directly.
        $currencyFields = [
            'total_sale_with_tax', 'total_sale_without_tax', 'total_tax',
            'total_sale_discount_with_tax', 'total_sale_discount_without_tax',
            'prime', 'cee_prime', 'pack_prime', 'ana_prime', 'ana_pack_prime',
            'ite_prime', 'fixed_prime', 'fee_file',
            'rest_in_charge', 'rest_in_charge_after_credit',
            'discount_amount', 'subvention', 'bbc_subvention', 'passoire_subvention',
            'tax_credit', 'tax_credit_used', 'tax_credit_available', 'tax_credit_limit',
            'home_prime', 'qmac_value',
        ];
        foreach ($currencyFields as $field) {
            $values[$field] = $this->fmtCurrency($q->{$field} ?? 0);
        }

        $formattedAliases = [
            'FormattedTotalSaleWithTax' => $values['total_sale_with_tax'],
            'FormattedTotalSaleWithoutTax' => $values['total_sale_without_tax'],
            'FormattedTotalSaleTax' => $values['total_tax'],
            'FormattedTotalTax' => $values['total_tax'],
            'FormattedPrime' => $values['prime'],
            'FormattedCeePrime' => $values['cee_prime'],
            'FormattedAnaPrime' => $values['ana_prime'],
            'FormattedAnaPackPrime' => $values['ana_pack_prime'],
            'FormattedPackPrime' => $values['pack_prime'],
            'FormattedITEPrime' => $values['ite_prime'],
            'FormattedFixedPrime' => $values['fixed_prime'],
            'FormattedFeeFile' => $values['fee_file'],
            'FormattedRestInCharge' => $values['rest_in_charge'],
            'FormattedRestInChargeAfterCredit' => $values['rest_in_charge_after_credit'],
            'FormattedDiscountAmount' => $values['discount_amount'],
            'FormattedTotalSaleDiscountWithTax' => $values['total_sale_discount_with_tax'],
            'FormattedTotalSaleDiscountWithoutTax' => $values['total_sale_discount_without_tax'],
            'FormattedSubvention' => $values['subvention'],
            'FormattedBBcSubvention' => $values['bbc_subvention'],
            'FormattedPassoireSubvention' => $values['passoire_subvention'],
            'FormattedTaxCredit' => $values['tax_credit'],
            'FormattedTaxCreditUsed' => $values['tax_credit_used'],
            'FormattedTaxCreditAvailable' => $values['tax_credit_available'],
            'FormattedTaxCreditLimit' => $values['tax_credit_limit'],
            'FormattedNumberOfPeople' => $this->fmtNumber($q->number_of_people),
            'FormattedNumberOfChildren' => $this->fmtNumber($q->number_of_children),
            'FormattedNumberOfParts' => $this->fmtNumber($q->number_of_parts),
            'FormattedReference' => $this->buildReference($q),
            'FormattedTotalSaleWithITEPrimeAndAnaPrimeAndDiscount' => $values['rest_in_charge'],
        ];

        $values['reference'] = $this->buildReference($q);
        $values['dated_at'] = $this->dateBundle($q->dated_at ?? null);
        $values['dated_at_15'] = $this->dateBundle($this->shiftDate($q->dated_at ?? null, '+15 days'));
        $values['dated_at_90'] = $this->dateBundle($this->shiftDate($q->dated_at ?? null, '+90 days'));
        $values['signed_at'] = $this->dateBundle($q->signed_at ?? null);
        $values['created_at'] = $this->dateBundle($q->created_at ?? null);
        $values['updated_at'] = $this->dateBundle($q->updated_at ?? null);

        // Aggregate total_tax from items when the raw column is empty
        // (Symfony's getTaxes()->toArray() does this on the fly — the column
        // itself is rarely populated in legacy data).
        $itemsTotalTax = $this->sumItemsTotalTax($q);
        $rawTotalTax = (float) ($q->total_tax ?? 0);
        $effectiveTotalTax = $rawTotalTax !== 0.0 ? $rawTotalTax : $itemsTotalTax;
        $values['total_tax'] = $this->fmtCurrency($effectiveTotalTax);
        $formattedAliases['FormattedTotalSaleTax'] = $values['total_tax'];
        $formattedAliases['FormattedTotalTax'] = $values['total_tax'];

        $values['taxes'] = $this->buildTaxesByRate($q);

        // Derived monetary fields that Symfony exposes via getFormatted* getters.
        // Symfony formula (DomoprimeQuotationBase::getTotalSaleWithITEPrimeAndAnaPrime,
        // line 2129+): TTC - ITE_PRIME - ANA_PRIME (subtraction, since the
        // primes already represent the deduction amount as a positive value;
        // signed differently across tenants but Symfony just subtracts them).
        $ttc = (float) ($q->total_sale_with_tax ?? 0);
        $itePrime = (float) ($q->ite_prime ?? 0);
        $anaPrime = (float) ($q->ana_prime ?? 0);
        $packPrime = (float) ($q->pack_prime ?? 0);
        $discount = (float) ($q->discount_amount ?? 0);

        $derivedFields = [
            'total_sale_with_ite_prime' => $ttc - $itePrime,
            'total_sale_with_ite_prime_discount' => $ttc - $itePrime - $discount,
            'total_sale_with_ite_prime_and_ana_prime' => $ttc - $itePrime - $anaPrime,
            'total_sale_with_ite_prime_and_ana_prime_discount' => $ttc - $itePrime - $anaPrime - $discount,
            'total_sale_with_pack_prime' => $ttc - $packPrime,
            'total_sale_with_pack_prime_discount' => $ttc - $packPrime - $discount,
            'total_sale_with_pack_prime_and_ana_prime' => $ttc - $packPrime - $anaPrime,
            'rest_in_charge_with_discount_amount' => $ttc - $discount,
        ];
        foreach ($derivedFields as $key => $amount) {
            $values[$key] = $this->fmtCurrency($amount);
        }
        $formattedAliases['FormattedTotalSaleWithITEPrimeAndAnaPrime'] = $values['total_sale_with_ite_prime_and_ana_prime'];
        $formattedAliases['FormattedTotalSaleWithITEPrime'] = $values['total_sale_with_ite_prime'];
        $formattedAliases['FormattedTotalSaleWithPackPrime'] = $values['total_sale_with_pack_prime'];
        $formattedAliases['FormattedTotalSaleWithITEPrimeAndAnaPrimeAndDiscount'] = $values['total_sale_with_ite_prime_and_ana_prime_discount'];

        return array_merge($values, $formattedAliases);
    }

    private function sumItemsTotalTax(DomoprimeQuotation $q): float
    {
        $sum = 0.0;
        if (! $q->relationLoaded('products')) {
            return 0.0;
        }
        foreach ($q->products as $product) {
            if (! $product->relationLoaded('items')) {
                continue;
            }
            foreach ($product->items as $item) {
                $sum += (float) ($item->total_tax ?? 0);
            }
        }

        return $sum;
    }

    /**
     * Aggregates tax amounts per VAT rate across all products/items.
     * Mirrors Symfony's $values['taxes'] = $this->getTaxes()->toArray() — used
     * by templates like:
     *   {$quotation.taxes["5.5"].amount}  →  "4,69 €"
     *   {$quotation.taxes["10"].amount}   →  "0,00 €"
     *
     * The rate comes from t_products_taxes.rate (looked up via item.tva_id),
     * NOT from the legacy `coefficient` column which is a quantity multiplier.
     */
    private function buildTaxesByRate(DomoprimeQuotation $q): array
    {
        $buckets = [];
        if ($q->relationLoaded('products')) {
            foreach ($q->products as $product) {
                if (! $product->relationLoaded('items')) {
                    continue;
                }
                foreach ($product->items as $item) {
                    $rate = $this->normalizeTaxRate($this->resolveTaxPercent($item->tva_id));
                    if (! isset($buckets[$rate])) {
                        $buckets[$rate] = ['rate' => $rate, 'base' => 0.0, 'amount' => 0.0];
                    }
                    $buckets[$rate]['base'] += (float) ($item->total_sale_price_without_tax ?? 0);
                    $buckets[$rate]['amount'] += (float) ($item->total_tax ?? 0);
                }
            }
        }

        foreach (['5.5', '10', '20'] as $defaultRate) {
            if (! isset($buckets[$defaultRate])) {
                $buckets[$defaultRate] = ['rate' => $defaultRate, 'base' => 0.0, 'amount' => 0.0];
            }
        }
        foreach ($buckets as $rate => &$bucket) {
            $bucket['base'] = $this->fmtCurrency($bucket['base']);
            $bucket['amount'] = $this->fmtCurrency($bucket['amount']);
        }

        return $buckets;
    }

    private function normalizeTaxRate($percent): string
    {
        $value = (float) $percent;
        // 5.5 stays as "5.5", 10.0 → "10", 20.0 → "20".
        return rtrim(rtrim(number_format($value, 2, '.', ''), '0'), '.');
    }

    /**
     * Returns the VAT percentage for a given tva_id (e.g. 5.5 for "5,50 %").
     * The Tax::rate column stores it as a fraction (0.055 = 5.5%) — we
     * normalise to a percentage value here.
     */
    private function resolveTaxPercent(?int $tvaId): float
    {
        if (! $tvaId) {
            return 0.0;
        }
        if (array_key_exists($tvaId, $this->taxRateCache)) {
            return $this->taxRateCache[$tvaId];
        }
        $rate = (float) (Tax::query()->whereKey($tvaId)->value('rate') ?? 0);
        // Symfony stores rates as fractions (0.055) in some installs and as
        // percentages (5.5) in others. Treat anything ≤ 1 as a fraction.
        if ($rate > 0 && $rate <= 1) {
            $rate *= 100;
        }

        return $this->taxRateCache[$tvaId] = $rate;
    }

    private function buildProducts(DomoprimeQuotation $q): array
    {
        if (! $q->relationLoaded('products')) {
            return [];
        }

        return $q->products->map(fn (DomoprimeQuotationProduct $p) => [
            'id' => (int) $p->id,
            'product_id' => (int) $p->product_id,
            'title' => (string) ($p->title ?? ''),
            'entitled' => (string) ($p->entitled ?? ''),
            'reference' => (string) ($p->title ?? ''),
            'quantity' => $this->fmtQuantity($p->quantity),
            'description' => (string) ($p->description ?? ''),
            'sale_price_with_tax' => $this->fmtCurrency($p->sale_price_with_tax),
            'sale_price_without_tax' => $this->fmtCurrency($p->sale_price_without_tax),
            'total_sale_price_with_tax' => $this->fmtCurrency($p->total_sale_price_with_tax),
            'total_sale_price_without_tax' => $this->fmtCurrency($p->total_sale_price_without_tax),
            'prime' => $this->fmtCurrency($p->prime),
            'FormattedTotalSaleWithTax' => $this->fmtCurrency($p->total_sale_price_with_tax),
            'FormattedTotalSaleWithoutTax' => $this->fmtCurrency($p->total_sale_price_without_tax),
            'items' => $p->items->map(fn (DomoprimeQuotationProductItem $it) => $this->buildItemRow($it))->all(),
        ])->all();
    }

    /**
     * Mirrors Symfony's DomoprimeQuotationProductItemBase::toArrayForQuotation().
     * Raw monetary columns are overwritten with formatted strings so templates
     * can render {$items.sale_price_with_tax} → "246,44 €" directly.
     * The TVA rate comes from t_products_taxes.rate via tva_id (NOT the
     * legacy `coefficient` column which is a quantity multiplier).
     */
    private function buildItemRow(DomoprimeQuotationProductItem $it): array
    {
        $taxPercent = $this->resolveTaxPercent($it->tva_id);

        return [
            'id' => (int) $it->id,
            'item_id' => (int) $it->item_id,
            'product_item_id' => (int) $it->product_item_id,
            'tva_id' => (int) ($it->tva_id ?? 0),
            'quantity' => $this->fmtQuantity($it->quantity),
            'unit' => (string) ($it->unit ?? ''),
            'coefficient' => (string) ($it->coefficient ?? ''),
            'rate_tax' => $this->fmtPercent($taxPercent),
            'sale_price_with_tax' => $this->fmtCurrency($it->sale_price_with_tax),
            'sale_price_without_tax' => $this->fmtCurrency($it->sale_price_without_tax),
            'total_sale_price_with_tax' => $this->fmtCurrency($it->total_sale_price_with_tax),
            'total_sale_price_without_tax' => $this->fmtCurrency($it->total_sale_price_without_tax),
            'total_tax' => $this->fmtCurrency($it->total_tax ?? 0),
            'unit_tax' => $this->fmtCurrency($it->unit_tax ?? 0),
            'description' => (string) ($it->description ?? ''),
            'is_master' => ($it->is_master ?? 'NO') === 'YES',
            'is_mandatory' => (string) ($it->is_mandatory ?? 'NO'),
            'item' => $this->buildItemCatalog((int) $it->item_id),
            'FormattedSalePriceWithTax' => $this->fmtCurrency($it->sale_price_with_tax),
            'FormattedSalePriceWithoutTax' => $this->fmtCurrency($it->sale_price_without_tax),
            'FormattedTotalSalePriceWithTax' => $this->fmtCurrency($it->total_sale_price_with_tax),
            'FormattedTotalSalePriceWithoutTax' => $this->fmtCurrency($it->total_sale_price_without_tax),
            'FormattedQuantity' => $this->fmtQuantity($it->quantity),
            'FormattedTaxRate' => $this->fmtPercent($taxPercent),
            'FormattedTotalTax' => $this->fmtCurrency($it->total_tax ?? 0),
        ];
    }

    private function buildItemCatalog(int $itemId): array
    {
        if ($itemId <= 0) {
            return $this->emptyItemCatalog($itemId);
        }
        if (isset($this->itemCatalogCache[$itemId])) {
            return $this->itemCatalogCache[$itemId];
        }

        $row = ProductItem::find($itemId);
        if (! $row) {
            return $this->itemCatalogCache[$itemId] = $this->emptyItemCatalog($itemId);
        }

        return $this->itemCatalogCache[$itemId] = [
            'id' => (int) $row->id,
            'product_id' => (int) $row->product_id,
            'reference' => (string) ($row->reference ?? ''),
            'description' => (string) ($row->description ?? ''),
            'unit' => (string) ($row->unit ?? ''),
            'sale_price' => (string) ($row->sale_price ?? '0'),
            'input1' => (string) ($row->input1 ?? ''),
            'input2' => (string) ($row->input2 ?? ''),
        ];
    }

    private function flattenItems(DomoprimeQuotation $q): array
    {
        $all = [];
        if (! $q->relationLoaded('products')) {
            return $all;
        }
        foreach ($q->products as $product) {
            foreach ($product->items as $it) {
                $all[] = $this->buildItemRow($it);
            }
        }

        return $all;
    }

    private function buildSubventionType(?DomoprimeSubventionType $t): array
    {
        if (! $t) {
            return [];
        }

        return [
            'id' => (int) $t->id,
            'name' => (string) ($t->name ?? ''),
            'commercial' => (string) ($t->commercial ?? ''),
        ];
    }

    private function buildCalculation(?DomoprimeCalculation $c): array
    {
        if (! $c) {
            return [];
        }

        return [
            'id' => (int) $c->id,
            'class_id' => (int) ($c->class_id ?? 0),
            'sector_id' => (int) ($c->sector_id ?? 0),
            'region_id' => (int) ($c->region_id ?? 0),
            'zone_id' => (int) ($c->zone_id ?? 0),
            'energy_id' => (int) ($c->energy_id ?? 0),
            'cee_prime' => (string) ($c->cee_prime ?? '0'),
            'prime' => (string) ($c->prime ?? '0'),
            'ana_prime' => (string) ($c->ana_prime ?? '0'),
            'subvention' => (string) ($c->subvention ?? '0'),
            'budget' => (string) ($c->budget ?? '0'),
            'qmac' => (string) ($c->qmac ?? '0'),
            'qmac_value' => (string) ($c->qmac_value ?? '0'),
            'economy' => (string) ($c->economy ?? '0'),
        ];
    }

    private function dateBundle($date): array
    {
        if (! $date) {
            return ['ddmmyyyy' => '', 'ddmmyy' => '', 'ddmmmmyyyy' => '', 'iso' => ''];
        }

        $carbon = $date instanceof CarbonInterface ? $date : Carbon::parse((string) $date);
        $carbon = $carbon->copy()->locale('fr_FR');

        return [
            'ddmmyyyy' => $carbon->format('d/m/Y'),
            'ddmmyy' => $carbon->format('d/m/y'),
            'ddmmmmyyyy' => $carbon->translatedFormat('d F Y'),
            'iso' => $carbon->format('Y-m-d'),
            'time' => $carbon->format('H:i'),
        ];
    }

    private function shiftDate($date, string $modifier): ?Carbon
    {
        if (! $date) {
            return null;
        }
        $carbon = $date instanceof CarbonInterface ? $date->copy() : Carbon::parse((string) $date);

        return $carbon->modify($modifier);
    }

    private function formatDate($date): string
    {
        if (! $date) {
            return '';
        }
        $carbon = $date instanceof CarbonInterface ? $date : Carbon::parse((string) $date);

        return $carbon->format('d/m/Y');
    }

    private function fmtCurrency($value): string
    {
        return number_format((float) ($value ?? 0), 2, ',', ' ').' €';
    }

    private function fmtNumber($value): string
    {
        return number_format((float) ($value ?? 0), 0, ',', ' ');
    }

    private function fmtQuantity($value): string
    {
        return number_format((float) ($value ?? 0), 2, ',', ' ');
    }

    private function fmtPercent($value): string
    {
        return number_format((float) ($value ?? 0), 2, ',', ' ').' %';
    }

    private function buildReference(DomoprimeQuotation $q): string
    {
        $raw = (string) ($q->reference ?? '');
        if ($raw !== '') {
            return $raw;
        }

        return (new QuotationReferenceGenerator())->format('', ['id' => (int) $q->id]);
    }

    private function emptyCompany(): array
    {
        return [
            'id' => 0,
            'name' => '', 'commercial' => '', 'address1' => '', 'address2' => '',
            'postcode' => '', 'city' => '', 'country' => '', 'phone' => '', 'mobile' => '',
            'fax' => '', 'email' => '', 'web' => '', 'siret' => '', 'tva' => '', 'type' => '',
            'picture' => ['url' => ''],
        ];
    }

    private function emptyCustomer(): array
    {
        return [
            'id' => 0,
            'firstname' => '', 'lastname' => '', 'civility' => '', 'gender' => '',
            'birthday' => '', 'phone' => '', 'phone1' => '', 'mobile' => '', 'mobile2' => '',
            'email' => '', 'company' => '',
            'address' => [
                'address1' => '', 'address2' => '', 'postcode' => '',
                'city' => '', 'country' => '', 'state' => '',
            ],
        ];
    }

    private function emptyItemCatalog(int $id): array
    {
        return [
            'id' => $id,
            'product_id' => 0,
            'reference' => '',
            'description' => '',
            'unit' => '',
            'sale_price' => '0',
            'input1' => '',
            'input2' => '',
        ];
    }
}
