<?php

namespace Modules\User\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * UserAttribution Model
 * Represents an attribution/assignment type that can be assigned to users
 * Table: t_users_attribution
 */
class UserAttribution extends Model
{
    protected $table = 't_users_attribution';

    protected $primaryKey = 'id';

    public $timestamps = false;

    protected $fillable = [
        'name',
    ];

    /**
     * Get all translations for this attribution
     */
    public function translations(): HasMany
    {
        return $this->hasMany(UserAttributionI18n::class, 'attribution_id', 'id');
    }

    /**
     * Get translation for a specific language
     */
    public function translation(string $lang = 'fr')
    {
        return $this->hasOne(UserAttributionI18n::class, 'attribution_id', 'id')
            ->where('lang', $lang);
    }

    /**
     * Get users who have this attribution
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            't_users_attributions',
            'attribution_id',
            'user_id'
        )->using(UserAttributions::class);
    }

    /**
     * Get the translated value for the current locale
     */
    public function getTranslatedValueAttribute(): ?string
    {
        $lang = app()->getLocale();
        $translation = $this->translation($lang)->first();
        return $translation?->value ?? $this->name;
    }

    /**
     * Scope to get with translation
     */
    public function scopeWithTranslation($query, string $lang = 'fr')
    {
        return $query->with(['translation' => function ($q) use ($lang) {
            $q->where('lang', $lang);
        }]);
    }
}
