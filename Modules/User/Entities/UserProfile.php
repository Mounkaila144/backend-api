<?php

namespace Modules\User\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * UserProfile Model
 * Represents a user profile/role type
 * Table: t_users_profile
 */
class UserProfile extends Model
{
    protected $table = 't_users_profile';

    protected $primaryKey = 'id';

    public $timestamps = true;
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'name',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get all translations for this profile
     */
    public function translations(): HasMany
    {
        return $this->hasMany(UserProfileI18n::class, 'profile_id', 'id');
    }

    /**
     * Get translation for a specific language
     */
    public function translation(string $lang = 'fr')
    {
        return $this->hasOne(UserProfileI18n::class, 'profile_id', 'id')
            ->where('lang', $lang);
    }

    /**
     * Get users who have this profile
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            't_users_profiles',
            'profile_id',
            'user_id'
        )->using(UserProfiles::class);
    }

    /**
     * Get functions/roles associated with this profile
     */
    public function functions(): BelongsToMany
    {
        return $this->belongsToMany(
            UserFunction::class,
            't_users_profile_function',
            'profile_id',
            'function_id'
        )->using(UserProfileFunction::class);
    }

    /**
     * Get groups associated with this profile
     */
    public function groups(): BelongsToMany
    {
        return $this->belongsToMany(
            \Modules\UsersGuard\Entities\Group::class,
            't_users_profile_group',
            'profile_id',
            'group_id'
        )->using(UserProfileGroup::class);
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
