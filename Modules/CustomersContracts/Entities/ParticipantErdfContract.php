<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParticipantErdfContract extends Model
{
    protected $connection = 'tenant';
    protected $table = 't_participants_erdf_contract';

    protected $fillable = [
        'contract_id', 'status_id', 'opened_at', 'resend_at', 'remarks',
    ];

    protected $casts = [
        'opened_at' => 'datetime',
        'resend_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function contract(): BelongsTo
    {
        return $this->belongsTo(CustomerContract::class, 'contract_id');
    }
}
