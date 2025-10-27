<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * CustomerContractContributor Model (TENANT DATABASE)
 *
 * @property int $id
 * @property string $type
 * @property int $contract_id
 * @property int $user_id
 * @property int $attribution_id
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class CustomerContractContributor extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_contracts_contributor';

    protected $fillable = [
        'type',
        'contract_id',
        'user_id',
        'attribution_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the contract that owns the contributor
     */
    public function contract(): BelongsTo
    {
        return $this->belongsTo(CustomerContract::class, 'contract_id');
    }

    /**
     * Get the user
     * Note: You may need to adjust this based on your Users module
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo('Modules\UsersGuard\Entities\User', 'user_id');
    }

    /**
     * Scope to filter by contributor type
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }
}
