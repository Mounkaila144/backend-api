<?php

namespace Modules\User\Entities;

use App\Traits\HasPermissions;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * User Entity - Uses tenant database (t_users table)
 * This model maps to the existing t_users table from the legacy Symfony application
 */
class User extends Model
{
    use HasPermissions;
    /**
     * Table name
     */
    protected $table = 't_users';

    /**
     * Primary key
     */
    protected $primaryKey = 'id';

    /**
     * Timestamps
     */
    public $timestamps = true;
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'username',
        'password',
        'sex',
        'firstname',
        'lastname',
        'email',
        'picture',
        'phone',
        'mobile',
        'birthday',
        'is_active',
        'is_guess',
        'last_password_gen',
        'lastlogin',
        'application',
        'status',
        'is_locked',
        'is_secure_by_code',
        'company_id',
        'callcenter_id',
        'creator_id',
        'unlocked_by',
        'number_of_try',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'password',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'is_active' => 'string',
        'is_guess' => 'string',
        'is_locked' => 'string',
        'is_secure_by_code' => 'string',
        'last_password_gen' => 'datetime',
        'lastlogin' => 'datetime',
        'birthday' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'number_of_try' => 'integer',
    ];

    /**
     * Default values
     */
    protected $attributes = [
        'is_active' => 'NO',
        'is_guess' => 'NO',
        'is_locked' => 'NO',
        'is_secure_by_code' => 'NO',
        'status' => 'ACTIVE',
        'application' => 'admin',
        'number_of_try' => 0,
    ];

    /**
     * Scope to filter by application
     */
    public function scopeApplication($query, $application)
    {
        return $query->where('application', $application);
    }

    /**
     * Scope to filter active users
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', 'YES');
    }

    /**
     * Scope to exclude superadmin users
     */
    public function scopeNoSuperadmin($query)
    {
        return $query->where('username', 'NOT LIKE', 'superadmin%');
    }

    /**
     * Scope to filter by status
     */
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to search by query (username, firstname, lastname, email)
     */
    public function scopeSearch($query, $search)
    {
        if (empty($search)) {
            return $query;
        }

        return $query->where(function ($q) use ($search) {
            $q->where('username', 'LIKE', "%{$search}%")
                ->orWhere('firstname', 'LIKE', "%{$search}%")
                ->orWhere('lastname', 'LIKE', "%{$search}%")
                ->orWhere('email', 'LIKE', "%{$search}%");
        });
    }

    /**
     * Get user's full name
     */
    public function getFullNameAttribute()
    {
        return trim("{$this->firstname} {$this->lastname}");
    }

    /**
     * Check if user is active
     */
    public function isActive(): bool
    {
        return $this->is_active === 'YES';
    }

    /**
     * Check if user is locked
     */
    public function isLocked(): bool
    {
        return $this->is_locked === 'YES';
    }

    /**
     * =========================================================================
     * RELATIONS
     * =========================================================================
     */

    /**
     * User groups relationship (many-to-many through t_user_group)
     */
    public function groups(): BelongsToMany
    {
        return $this->belongsToMany(
            \Modules\UsersGuard\Entities\Group::class,
            't_user_group',
            'user_id',
            'group_id'
        );
    }

    /**
     * User functions/roles (many-to-many)
     */
    public function functions(): BelongsToMany
    {
        return $this->belongsToMany(
            UserFunction::class,
            't_users_functions',
            'user_id',
            'function_id'
        )->using(UserFunctions::class);
    }

    /**
     * User attributions (many-to-many)
     */
    public function attributions(): BelongsToMany
    {
        return $this->belongsToMany(
            UserAttribution::class,
            't_users_attributions',
            'user_id',
            'attribution_id'
        )->using(UserAttributions::class);
    }

    /**
     * User teams (many-to-many)
     */
    public function teams(): BelongsToMany
    {
        return $this->belongsToMany(
            UserTeam::class,
            't_users_team_users',
            'user_id',
            'team_id'
        )->using(UserTeamUsers::class);
    }

    /**
     * Teams where this user is the manager
     */
    public function managedTeams(): HasMany
    {
        return $this->hasMany(UserTeam::class, 'manager_id', 'id');
    }

    /**
     * Teams where this user is the secondary manager (manager2_id)
     */
    public function managedTeamsSecondary(): HasMany
    {
        return $this->hasMany(UserTeam::class, 'manager2_id', 'id');
    }

    /**
     * Direct manager relationship (through t_users_team_manager pivot)
     */
    public function managers(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            't_users_team_manager',
            'user_id',
            'manager_id'
        )->using(UserTeamManager::class);
    }

    /**
     * Users managed by this user (through t_users_team_manager pivot)
     */
    public function managedUsers(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            't_users_team_manager',
            'manager_id',
            'user_id'
        )->using(UserTeamManager::class);
    }

    /**
     * User creator relationship
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    /**
     * Users created by this user
     */
    public function createdUsers(): HasMany
    {
        return $this->hasMany(User::class, 'creator_id', 'id');
    }

    /**
     * User who unlocked this user
     */
    public function unlocker()
    {
        return $this->belongsTo(User::class, 'unlocked_by');
    }

    /**
     * Users unlocked by this user
     */
    public function unlockedUsers(): HasMany
    {
        return $this->hasMany(User::class, 'unlocked_by', 'id');
    }

    /**
     * User properties/settings
     */
    public function properties(): HasMany
    {
        return $this->hasMany(UserProperty::class, 'user_id', 'id');
    }

    /**
     * Get a specific property by name
     */
    public function property(string $name)
    {
        return $this->properties()->where('name', $name)->first();
    }

    /**
     * User profiles (many-to-many)
     */
    public function profiles(): BelongsToMany
    {
        return $this->belongsToMany(
            UserProfile::class,
            't_users_profiles',
            'user_id',
            'profile_id'
        )->using(UserProfiles::class);
    }

    /**
     * User validation tokens
     */
    public function validationTokens(): HasMany
    {
        return $this->hasMany(UserValidationToken::class, 'user_id', 'id');
    }

    /**
     * User logout requests
     */
    public function logoutRequests(): HasMany
    {
        return $this->hasMany(UserLogoutRequest::class, 'user_id', 'id');
    }

    /**
     * Callcenter relationship
     */
    public function callcenter(): BelongsTo
    {
        return $this->belongsTo(Callcenter::class, 'callcenter_id', 'id');
    }

    /**
     * Team relationship (direct via team_id)
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(UserTeam::class, 'team_id', 'id');
    }

    /**
     * =========================================================================
     * HELPER METHODS
     * =========================================================================
     */

    /**
     * Get user's team IDs
     */
    public function getTeamIds(): array
    {
        return $this->teams()->pluck('t_users_team.id')->toArray();
    }

    /**
     * Get user's function names
     */
    public function getFunctionNames(string $lang = 'fr'): array
    {
        return $this->functions()
            ->with(['translation' => function ($q) use ($lang) {
                $q->where('lang', $lang);
            }])
            ->get()
            ->map(function ($function) {
                return $function->translated_value;
            })
            ->toArray();
    }

    /**
     * Get user's attribution names
     */
    public function getAttributionNames(string $lang = 'fr'): array
    {
        return $this->attributions()
            ->with(['translation' => function ($q) use ($lang) {
                $q->where('lang', $lang);
            }])
            ->get()
            ->map(function ($attribution) {
                return $attribution->translated_value;
            })
            ->toArray();
    }

    /**
     * Check if user has a specific function
     */
    public function hasFunction(int $functionId): bool
    {
        return $this->functions()->where('t_users_function.id', $functionId)->exists();
    }

    /**
     * Check if user has a specific attribution
     */
    public function hasAttribution(int $attributionId): bool
    {
        return $this->attributions()->where('t_users_attribution.id', $attributionId)->exists();
    }

    /**
     * Check if user is in a specific team
     */
    public function isInTeam(int $teamId): bool
    {
        return $this->teams()->where('t_users_team.id', $teamId)->exists();
    }

    /**
     * Check if user is a team manager
     */
    public function isTeamManager(): bool
    {
        return $this->managedTeams()->exists();
    }

    /**
     * Get user's profile IDs
     */
    public function getProfileIds(): array
    {
        return $this->profiles()->pluck('t_users_profile.id')->toArray();
    }

    /**
     * Get user's profile names
     */
    public function getProfileNames(string $lang = 'fr'): array
    {
        return $this->profiles()
            ->with(['translation' => function ($q) use ($lang) {
                $q->where('lang', $lang);
            }])
            ->get()
            ->map(function ($profile) {
                return $profile->translated_value;
            })
            ->toArray();
    }

    /**
     * Check if user has a specific profile
     */
    public function hasProfile(int $profileId): bool
    {
        return $this->profiles()->where('t_users_profile.id', $profileId)->exists();
    }

    /**
     * Get active validation tokens for this user
     */
    public function getActiveValidationTokens(string $type = null)
    {
        $query = $this->validationTokens()->active();

        if ($type) {
            $query->type($type);
        }

        return $query->get();
    }

    /**
     * Get pending logout requests for this user
     */
    public function getPendingLogoutRequests()
    {
        return $this->logoutRequests()->pending()->get();
    }
}
