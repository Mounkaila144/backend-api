<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property int $id
 * @property int $contract_id
 * @property string $comment
 * @property string $status (ACTIVE, DELETE)
 * @property string $type
 * @property string $signature
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class CustomerContractComment extends Model
{
    protected $connection = 'tenant';
    protected $table = 't_customers_contracts_comments';

    protected $fillable = [
        'contract_id',
        'comment',
        'status',
        'type',
        'signature',
    ];

    protected $attributes = [
        'status' => 'ACTIVE',
        'type' => '',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function contract(): BelongsTo
    {
        return $this->belongsTo(CustomerContract::class, 'contract_id');
    }

    public function history(): HasOne
    {
        return $this->hasOne(CustomerContractCommentHistory::class, 'comment_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE');
    }
}
