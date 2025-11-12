<?php

namespace Modules\User\Entities;

use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * UserProfileGroup Pivot Model
 * Links profiles to their groups/permissions
 * Table: t_users_profile_group
 */
class UserProfileGroup extends Pivot
{
    protected $table = 't_users_profile_group';

    protected $primaryKey = 'id';

    public $incrementing = true;

    public $timestamps = true;
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'group_id',
        'profile_id',
    ];

    protected $casts = [
        'group_id' => 'integer',
        'profile_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the group
     * Note: This references t_groups table which should be in UsersGuard module
     */
    public function group(): BelongsTo
    {
        return $this->belongsTo(\Modules\UsersGuard\Entities\Group::class, 'group_id', 'id');
    }

    /**
     * Get the profile
     */
    public function profile(): BelongsTo
    {
        return $this->belongsTo(UserProfile::class, 'profile_id', 'id');
    }
}
