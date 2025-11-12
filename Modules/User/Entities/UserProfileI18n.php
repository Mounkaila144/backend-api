<?php

namespace Modules\User\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * UserProfileI18n Model
 * Translations for user profiles
 * Table: t_users_profile_i18n
 */
class UserProfileI18n extends Model
{
    protected $table = 't_users_profile_i18n';

    protected $primaryKey = 'id';

    public $timestamps = true;
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'profile_id',
        'lang',
        'value',
    ];

    protected $casts = [
        'profile_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the parent profile
     */
    public function profile(): BelongsTo
    {
        return $this->belongsTo(UserProfile::class, 'profile_id', 'id');
    }

    /**
     * Scope to filter by language
     */
    public function scopeLang($query, string $lang)
    {
        return $query->where('lang', $lang);
    }
}
