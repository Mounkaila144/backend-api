<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Product\Entities\Product;
use Modules\User\Entities\User;

/**
 * @property int $id
 * @property int $contract_id
 * @property int $installer_id
 * @property int $product_id
 * @property int $item_id
 * @property string $in_at
 * @property string $out_at
 * @property string $range_id
 * @property string $details
 * @property string $status (ACTIVE, DELETE)
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class ProductInstallerSchedule extends Model
{
    protected $connection = 'tenant';
    protected $table = 't_products_installer_schedule';

    protected $fillable = [
        'contract_id',
        'installer_id',
        'product_id',
        'item_id',
        'in_at',
        'out_at',
        'range_id',
        'details',
        'status',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'in_at' => 'datetime',
    ];

    public function contract(): BelongsTo
    {
        return $this->belongsTo(CustomerContract::class, 'contract_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function installer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'installer_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE');
    }
}
