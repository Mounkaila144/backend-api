<?php

namespace Modules\User\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * UserTeam Model
 * Represents a team of users
 * Table: t_users_team
 */
class UserTeam extends Model
{
    protected $table = 't_users_team';

    protected $primaryKey = 'id';

    public $timestamps = true;
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'name',
        'manager_id',
    ];

    protected $casts = [
        'manager_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the primary manager of this team
     */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id', 'id');
    }


    /**
     * Get all users in this team (many-to-many)
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            't_users_team_users',
            'team_id',
            'user_id'
        )->using(UserTeamUsers::class);
    }

    /**
     * Get all team user pivot records
     */
    public function teamUsers(): HasMany
    {
        return $this->hasMany(UserTeamUsers::class, 'team_id', 'id');
    }

    /**
     * Scope to get teams with their manager
     */
    public function scopeWithManager($query)
    {
        return $query->with('manager');
    }

    /**
     * Scope to get teams for a specific manager
     */
    public function scopeForManager($query, int $managerId)
    {
        return $query->where('manager_id', $managerId);
    }
}
