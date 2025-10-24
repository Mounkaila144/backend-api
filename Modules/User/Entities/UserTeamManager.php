<?php

namespace Modules\User\Entities;

use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * UserTeamManager Pivot Model
 * Links managers to users they manage
 * Table: t_users_team_manager
 */
class UserTeamManager extends Pivot
{
    protected $table = 't_users_team_manager';

    protected $primaryKey = 'id';

    public $incrementing = true;

    public $timestamps = false;

    protected $fillable = [
        'manager_id',
        'user_id',
    ];

    protected $casts = [
        'manager_id' => 'integer',
        'user_id' => 'integer',
    ];

    /**
     * Get the manager
     */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id', 'id');
    }

    /**
     * Get the managed user
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
}
