<?php

namespace Modules\User\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * UserAttributionI18n Model
 * Translations for user attributions
 * Table: t_users_attribution_i18n
 */
class UserAttributionI18n extends Model
{
    protected $table = 't_users_attribution_i18n';

    protected $primaryKey = 'id';

    public $timestamps = true;
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'attribution_id',
        'lang',
        'value',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the parent attribution
     */
    public function attribution(): BelongsTo
    {
        return $this->belongsTo(UserAttribution::class, 'attribution_id', 'id');
    }

    /**
     * Scope to filter by language
     */
    public function scopeLang($query, string $lang)
    {
        return $query->where('lang', $lang);
    }
}
