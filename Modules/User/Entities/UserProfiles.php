<?php

namespace Modules\User\Entities;

use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * UserProfiles Pivot Model
 * Links users to their profiles
 * Table: t_users_profiles
 */
class UserProfiles extends Pivot
{
    protected $table = 't_users_profiles';

    protected $primaryKey = 'id';

    public $incrementing = true;

    public $timestamps = true;
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'profile_id',
        'user_id',
    ];

    protected $casts = [
        'profile_id' => 'integer',
        'user_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the profile
     */
    public function profile(): BelongsTo
    {
        return $this->belongsTo(UserProfile::class, 'profile_id', 'id');
    }

    /**
     * Get the user
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
}
