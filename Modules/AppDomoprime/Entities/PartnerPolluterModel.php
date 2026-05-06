<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\PartnerPolluter\Entities\PartnerPolluterCompany;

/**
 * Polluter model template (table: t_partner_polluter_model)
 *
 * @property int $id
 * @property int $polluter_id
 * @property string $name
 * @property string $extension
 */
class PartnerPolluterModel extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_partner_polluter_model';

    protected $fillable = [
        'polluter_id',
        'name',
        'extension',
    ];

    protected $casts = [
        'polluter_id' => 'integer',
        'created_at'  => 'datetime',
        'updated_at'  => 'datetime',
    ];

    public function polluter(): BelongsTo
    {
        return $this->belongsTo(PartnerPolluterCompany::class, 'polluter_id');
    }

    public function translations(): HasMany
    {
        return $this->hasMany(PartnerPolluterModelI18n::class, 'model_id');
    }
}
