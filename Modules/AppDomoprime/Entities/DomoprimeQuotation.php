<?php

namespace Modules\AppDomoprime\Entities;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $reference
 * @property int $month
 * @property int $year
 * @property int $number_of_parts
 * @property \Illuminate\Support\Carbon|null $dated_at
 * @property string $mode
 * @property string $type
 * @property string $total_sale_without_tax
 * @property string $total_sale_discount_with_tax
 * @property string $total_sale_discount_without_tax
 * @property string $total_sale_101_with_tax
 * @property string $total_sale_101_without_tax
 * @property string $total_sale_102_with_tax
 * @property string $total_sale_102_without_tax
 * @property string $total_sale_103_with_tax
 * @property string $total_sale_103_without_tax
 * @property string $total_added_with_tax_wall
 * @property string $total_added_with_tax_floor
 * @property string $total_added_with_tax_top
 * @property string $total_added_without_tax_wall
 * @property string $total_added_without_tax_floor
 * @property string $total_added_without_tax_top
 * @property string $total_restincharge_with_tax_wall
 * @property string $total_restincharge_with_tax_floor
 * @property string $total_restincharge_with_tax_top
 * @property string $total_restincharge_without_tax_wall
 * @property string $total_restincharge_without_tax_floor
 * @property string $total_restincharge_without_tax_top
 * @property string $total_purchase_without_tax
 * @property string $total_sale_with_tax
 * @property string $total_tax
 * @property string $total_purchase_with_tax
 * @property string $taxes
 * @property string|null $tax_credit
 * @property string $one_euro
 * @property int|null $meeting_id
 * @property int $customer_id
 * @property int|null $contract_id
 * @property int|null $calculation_id
 * @property int|null $company_id
 * @property int|null $polluter_id
 * @property int $creator_id
 * @property int|null $work_id
 * @property int|null $subvention_type_id
 * @property string $subvention
 * @property string $bbc_subvention
 * @property string $passoire_subvention
 * @property string $comments
 * @property string|null $remarks
 * @property string|null $header
 * @property string|null $footer
 * @property int $status_id
 * @property string $is_signed
 * @property \Illuminate\Support\Carbon|null $signed_at
 * @property string $is_last
 * @property string $status
 * @property string $prime
 * @property string $cee_prime
 * @property string $pack_prime
 * @property string $ana_prime
 * @property string $ana_pack_prime
 * @property string $ite_prime
 * @property string|null $engine
 * @property string $fixed_prime
 * @property string $fee_file
 * @property string $rest_in_charge
 * @property string $number_of_children
 * @property string $tax_credit_limit
 * @property string $rest_in_charge_after_credit
 * @property string $tax_credit_available
 * @property string $qmac_value
 * @property string|null $discount_amount
 * @property string|null $home_prime
 * @property string $number_of_people
 * @property string $tax_credit_used
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read DomoprimeCalculation|null $calculation
 * @property-read DomoprimeSubventionType|null $subventionType
 * @property-read \Illuminate\Database\Eloquent\Collection<int, DomoprimeQuotationProduct> $products
 * @property-read \Illuminate\Database\Eloquent\Collection<int, DomoprimeQuotationProductItem> $productItems
 * @property-read \Illuminate\Database\Eloquent\Collection<int, DomoprimeBilling> $billings
 * @property-read User|null $creator
 */
class DomoprimeQuotation extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_quotation';

    protected $fillable = [
        'reference',
        'month',
        'year',
        'number_of_parts',
        'dated_at',
        'mode',
        'type',
        'total_sale_without_tax',
        'total_sale_discount_with_tax',
        'total_sale_discount_without_tax',
        'total_sale_101_with_tax',
        'total_sale_101_without_tax',
        'total_sale_102_with_tax',
        'total_sale_102_without_tax',
        'total_sale_103_with_tax',
        'total_sale_103_without_tax',
        'total_added_with_tax_wall',
        'total_added_with_tax_floor',
        'total_added_with_tax_top',
        'total_added_without_tax_wall',
        'total_added_without_tax_floor',
        'total_added_without_tax_top',
        'total_restincharge_with_tax_wall',
        'total_restincharge_with_tax_floor',
        'total_restincharge_with_tax_top',
        'total_restincharge_without_tax_wall',
        'total_restincharge_without_tax_floor',
        'total_restincharge_without_tax_top',
        'total_purchase_without_tax',
        'total_sale_with_tax',
        'total_tax',
        'total_purchase_with_tax',
        'taxes',
        'tax_credit',
        'one_euro',
        'meeting_id',
        'customer_id',
        'contract_id',
        'calculation_id',
        'company_id',
        'polluter_id',
        'creator_id',
        'work_id',
        'subvention_type_id',
        'subvention',
        'bbc_subvention',
        'passoire_subvention',
        'comments',
        'remarks',
        'header',
        'footer',
        'status_id',
        'is_signed',
        'signed_at',
        'is_last',
        'status',
        'prime',
        'cee_prime',
        'pack_prime',
        'ana_prime',
        'ana_pack_prime',
        'ite_prime',
        'engine',
        'fixed_prime',
        'fee_file',
        'rest_in_charge',
        'number_of_children',
        'tax_credit_limit',
        'rest_in_charge_after_credit',
        'tax_credit_available',
        'qmac_value',
        'discount_amount',
        'home_prime',
        'number_of_people',
        'tax_credit_used',
    ];

    protected $casts = [
        'id' => 'integer',
        'month' => 'integer',
        'year' => 'integer',
        'number_of_parts' => 'integer',
        'dated_at' => 'datetime',
        'total_sale_without_tax' => 'decimal:6',
        'total_sale_discount_with_tax' => 'decimal:6',
        'total_sale_discount_without_tax' => 'decimal:6',
        'total_sale_101_with_tax' => 'decimal:6',
        'total_sale_101_without_tax' => 'decimal:6',
        'total_sale_102_with_tax' => 'decimal:6',
        'total_sale_102_without_tax' => 'decimal:6',
        'total_sale_103_with_tax' => 'decimal:6',
        'total_sale_103_without_tax' => 'decimal:6',
        'total_added_with_tax_wall' => 'decimal:6',
        'total_added_with_tax_floor' => 'decimal:6',
        'total_added_with_tax_top' => 'decimal:6',
        'total_added_without_tax_wall' => 'decimal:6',
        'total_added_without_tax_floor' => 'decimal:6',
        'total_added_without_tax_top' => 'decimal:6',
        'total_restincharge_with_tax_wall' => 'decimal:6',
        'total_restincharge_with_tax_floor' => 'decimal:6',
        'total_restincharge_with_tax_top' => 'decimal:6',
        'total_restincharge_without_tax_wall' => 'decimal:6',
        'total_restincharge_without_tax_floor' => 'decimal:6',
        'total_restincharge_without_tax_top' => 'decimal:6',
        'total_purchase_without_tax' => 'decimal:6',
        'total_sale_with_tax' => 'decimal:6',
        'total_tax' => 'decimal:6',
        'total_purchase_with_tax' => 'decimal:6',
        'tax_credit' => 'decimal:6',
        'meeting_id' => 'integer',
        'customer_id' => 'integer',
        'contract_id' => 'integer',
        'calculation_id' => 'integer',
        'company_id' => 'integer',
        'polluter_id' => 'integer',
        'creator_id' => 'integer',
        'work_id' => 'integer',
        'subvention_type_id' => 'integer',
        'subvention' => 'decimal:6',
        'bbc_subvention' => 'decimal:6',
        'passoire_subvention' => 'decimal:6',
        'status_id' => 'integer',
        'signed_at' => 'datetime',
        'prime' => 'decimal:6',
        'cee_prime' => 'decimal:6',
        'pack_prime' => 'decimal:6',
        'ana_prime' => 'decimal:6',
        'ana_pack_prime' => 'decimal:6',
        'ite_prime' => 'decimal:6',
        'fixed_prime' => 'decimal:6',
        'fee_file' => 'decimal:6',
        'rest_in_charge' => 'decimal:6',
        'number_of_children' => 'decimal:6',
        'tax_credit_limit' => 'decimal:6',
        'rest_in_charge_after_credit' => 'decimal:6',
        'tax_credit_available' => 'decimal:6',
        'qmac_value' => 'decimal:6',
        'discount_amount' => 'decimal:6',
        'home_prime' => 'decimal:6',
        'number_of_people' => 'decimal:6',
        'tax_credit_used' => 'decimal:6',
    ];

    // ---------------------------------------------------------------
    // Relations
    // ---------------------------------------------------------------

    public function calculation(): BelongsTo
    {
        return $this->belongsTo(DomoprimeCalculation::class, 'calculation_id');
    }

    public function subventionType(): BelongsTo
    {
        return $this->belongsTo(DomoprimeSubventionType::class, 'subvention_type_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function products(): HasMany
    {
        return $this->hasMany(DomoprimeQuotationProduct::class, 'quotation_id');
    }

    public function productItems(): HasMany
    {
        return $this->hasMany(DomoprimeQuotationProductItem::class, 'quotation_id');
    }

    public function billings(): HasMany
    {
        return $this->hasMany(DomoprimeBilling::class, 'quotation_id');
    }

    // ---------------------------------------------------------------
    // Scopes
    // ---------------------------------------------------------------

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'ACTIVE');
    }

    public function scopeDeleted(Builder $query): Builder
    {
        return $query->where('status', 'DELETE');
    }

    public function scopeLast(Builder $query): Builder
    {
        return $query->where('is_last', 'YES');
    }
}
