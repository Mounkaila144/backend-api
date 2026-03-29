<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParticipantErdfQuotation extends Model
{
    protected $connection = 'tenant';
    protected $table = 't_participants_erdf_quotation';

    protected $casts = [
        'opened_at' => 'datetime',
        'received_at' => 'datetime',
        'check_at' => 'datetime',
        'amount' => 'float',
        'check_amount' => 'float',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function contract(): BelongsTo
    {
        return $this->belongsTo(CustomerContract::class, 'contract_id');
    }
}
