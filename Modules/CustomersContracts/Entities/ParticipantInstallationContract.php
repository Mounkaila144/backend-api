<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\User\Entities\User;

class ParticipantInstallationContract extends Model
{
    protected $connection = 'tenant';
    protected $table = 't_participants_installation_contract';

    protected $casts = [
        'counter_at' => 'datetime',
        'linked_at' => 'datetime',
        'worked_at' => 'datetime',
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
