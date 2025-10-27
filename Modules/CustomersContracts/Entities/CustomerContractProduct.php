<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * CustomerContractProduct Model (TENANT DATABASE)
 *
 * @property int $id
 * @property int $contract_id
 * @property int $product_id
 * @property string $details
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class CustomerContractProduct extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_contract_product';

    protected $fillable = [
        'contract_id',
        'product_id',
        'details',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the contract that owns the product
     */
    public function contract(): BelongsTo
    {
        return $this->belongsTo(CustomerContract::class, 'contract_id');
    }

    /**
     * Get the product details
     * Note: You may need to create a Product model in the Products module
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo('Modules\Products\Entities\Product', 'product_id');
    }
}
