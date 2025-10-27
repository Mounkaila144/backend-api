<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * CustomerContractHistory Model (TENANT DATABASE)
 *
 * @property int $id
 * @property int $contract_id
 * @property int $user_id
 * @property string $user_application (admin/superadmin)
 * @property string $history
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class CustomerContractHistory extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_contracts_history';

    protected $fillable = [
        'contract_id',
        'user_id',
        'user_application',
        'history',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the contract that owns the history
     */
    public function contract(): BelongsTo
    {
        return $this->belongsTo(CustomerContract::class, 'contract_id');
    }

    /**
     * Get the user who made the change
     * Note: You may need to adjust this based on your Users module
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo('Modules\UsersGuard\Entities\User', 'user_id');
    }

    /**
     * Scope to filter by application type
     */
    public function scopeFromAdmin($query)
    {
        return $query->where('user_application', 'admin');
    }

    /**
     * Scope to filter by superadmin
     */
    public function scopeFromSuperadmin($query)
    {
        return $query->where('user_application', 'superadmin');
    }
}
