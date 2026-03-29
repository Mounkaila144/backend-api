<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParticipantCityhallContract extends Model
{
    protected $connection = 'tenant';
    protected $table = 't_participants_cityhall_contract';

    protected $casts = [
        'send_at' => 'datetime',
        'ack_at' => 'datetime',
        'state_at' => 'datetime',
        'resend_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function contract(): BelongsTo
    {
        return $this->belongsTo(CustomerContract::class, 'contract_id');
    }
}
