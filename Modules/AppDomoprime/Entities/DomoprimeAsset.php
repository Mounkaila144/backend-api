<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $reference
 * @property int $month
 * @property int $day
 * @property int $year
 * @property \Illuminate\Support\Carbon|null $dated_at
 * @property string $total_asset_without_tax
 * @property string $total_asset_with_tax
 * @property string $total_tax
 * @property int|null $meeting_id
 * @property int|null $contract_id
 * @property int|null $company_id
 * @property int $customer_id
 * @property int|null $billing_id
 * @property int $creator_id
 * @property int|null $work_id
 * @property string $comments
 * @property int $status_id
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read DomoprimeBilling|null $billing
 * @property-read \Illuminate\Database\Eloquent\Collection<int, DomoprimeAssetProduct> $products
 * @property-read \Illuminate\Database\Eloquent\Collection<int, DomoprimeAssetProductItem> $productItems
 */
class DomoprimeAsset extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_asset';

    protected $fillable = [
        'reference',
        'month',
        'day',
        'year',
        'dated_at',
        'total_asset_without_tax',
        'total_asset_with_tax',
        'total_tax',
        'meeting_id',
        'contract_id',
        'company_id',
        'customer_id',
        'billing_id',
        'creator_id',
        'work_id',
        'comments',
        'status_id',
        'status',
    ];

    protected $casts = [
        'id' => 'integer',
        'reference' => 'string',
        'month' => 'integer',
        'day' => 'integer',
        'year' => 'integer',
        'dated_at' => 'datetime',
        'total_asset_without_tax' => 'decimal:6',
        'total_asset_with_tax' => 'decimal:6',
        'total_tax' => 'decimal:6',
        'meeting_id' => 'integer',
        'contract_id' => 'integer',
        'company_id' => 'integer',
        'customer_id' => 'integer',
        'billing_id' => 'integer',
        'creator_id' => 'integer',
        'work_id' => 'integer',
        'comments' => 'string',
        'status_id' => 'integer',
        'status' => 'string',
    ];

    // ---------------------------------------------------------------
    // Relations
    // ---------------------------------------------------------------

    public function billing(): BelongsTo
    {
        return $this->belongsTo(DomoprimeBilling::class, 'billing_id');
    }

    public function products(): HasMany
    {
        return $this->hasMany(DomoprimeAssetProduct::class, 'asset_id');
    }

    public function productItems(): HasMany
    {
        return $this->hasMany(DomoprimeAssetProductItem::class, 'asset_id');
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
}
