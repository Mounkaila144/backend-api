<?php

namespace Modules\User\Entities;

use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * UserProfileFunction Pivot Model
 * Links profiles to their functions/roles
 * Table: t_users_profile_function
 */
class UserProfileFunction extends Pivot
{
    protected $table = 't_users_profile_function';

    protected $primaryKey = 'id';

    public $incrementing = true;

    public $timestamps = true;
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'function_id',
        'profile_id',
    ];

    protected $casts = [
        'function_id' => 'integer',
        'profile_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the function
     */
    public function function(): BelongsTo
    {
        return $this->belongsTo(UserFunction::class, 'function_id', 'id');
    }

    /**
     * Get the profile
     */
    public function profile(): BelongsTo
    {
        return $this->belongsTo(UserProfile::class, 'profile_id', 'id');
    }
}
