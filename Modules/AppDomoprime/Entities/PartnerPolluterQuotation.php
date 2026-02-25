<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * PartnerPolluterQuotation Model (TENANT DATABASE)
 * Table: t_partner_polluter_quotation
 *
 * @property int $id
 * @property int|null $polluter_id
 * @property int|null $model_id
 * @property int|null $pre_model_id
 * @property int|null $post_company_model_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read DomoprimeQuotationModel|null $quotationModel
 */
class PartnerPolluterQuotation extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_partner_polluter_quotation';

    protected $fillable = [
        'polluter_id',
        'model_id',
        'pre_model_id',
        'post_company_model_id',
    ];

    protected $casts = [
        'id' => 'integer',
        'polluter_id' => 'integer',
        'model_id' => 'integer',
        'pre_model_id' => 'integer',
        'post_company_model_id' => 'integer',
    ];

    public function quotationModel(): BelongsTo
    {
        return $this->belongsTo(DomoprimeQuotationModel::class, 'model_id');
    }
}
