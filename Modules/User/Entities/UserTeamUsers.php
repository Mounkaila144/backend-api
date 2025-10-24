<?php

namespace Modules\User\Entities;

use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * UserTeamUsers Pivot Model
 * Links users to teams
 * Table: t_users_team_users
 */
class UserTeamUsers extends Pivot
{
    protected $table = 't_users_team_users';

    protected $primaryKey = 'id';

    public $incrementing = true;

    public $timestamps = false;

    protected $fillable = [
        'team_id',
        'user_id',
    ];

    protected $casts = [
        'team_id' => 'integer',
        'user_id' => 'integer',
    ];

    /**
     * Get the team
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(UserTeam::class, 'team_id', 'id');
    }

    /**
     * Get the user
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
}
