<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property int $id
 * @property int $model_id
 * @property int $partner_id
 * @property int $contract_id
 * @property string $mobile
 * @property string $message
 * @property string $send_at
 * @property \Carbon\Carbon $created_at
 */
class PartnerWhatsAppSent extends Model
{
    protected $connection = 'tenant';
    protected $table = 't_partners_whats_app_sent';

    public $timestamps = false;

    protected $casts = [
        'created_at' => 'datetime',
        'send_at' => 'datetime',
    ];

    public function history(): HasOne
    {
        return $this->hasOne(PartnerWhatsAppHistory::class, 'whats_app_id');
    }
}
