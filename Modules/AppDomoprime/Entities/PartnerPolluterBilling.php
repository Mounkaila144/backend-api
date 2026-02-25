<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * PartnerPolluterBilling Model (TENANT DATABASE)
 * Table: t_partner_polluter_billing
 *
 * @property int $id
 * @property int|null $polluter_id
 * @property int|null $model_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read DomoprimeBillingModel|null $billingModel
 */
class PartnerPolluterBilling extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_partner_polluter_billing';

    protected $fillable = [
        'polluter_id',
        'model_id',
    ];

    protected $casts = [
        'id' => 'integer',
        'polluter_id' => 'integer',
        'model_id' => 'integer',
    ];

    public function billingModel(): BelongsTo
    {
        return $this->belongsTo(DomoprimeBillingModel::class, 'model_id');
    }
}
