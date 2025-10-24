<?php

namespace Modules\User\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * UserFunction Model
 * Represents a function/role type that can be assigned to users
 * Table: t_users_function
 */
class UserFunction extends Model
{
    protected $table = 't_users_function';

    protected $primaryKey = 'id';

    public $timestamps = false;

    protected $fillable = [
        'name',
    ];

    /**
     * Get all translations for this function
     */
    public function translations(): HasMany
    {
        return $this->hasMany(UserFunctionI18n::class, 'function_id', 'id');
    }

    /**
     * Get translation for a specific language
     */
    public function translation(string $lang = 'fr')
    {
        return $this->hasOne(UserFunctionI18n::class, 'function_id', 'id')
            ->where('lang', $lang);
    }

    /**
     * Get users who have this function
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            't_users_functions',
            'function_id',
            'user_id'
        );
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
