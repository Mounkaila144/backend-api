<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\User\Entities\User;

class ParticipantConsuelContract extends Model
{
    protected $connection = 'tenant';
    protected $table = 't_participants_consuel_contract';

    protected $casts = [
        'send_at' => 'datetime',
        'modified_at' => 'datetime',
        'visited_at' => 'datetime',
        'revisited_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function contract(): BelongsTo
    {
        return $this->belongsTo(CustomerContract::class, 'contract_id');
    }

    public function installer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'installer_id');
    }
}
