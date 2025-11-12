<?php

namespace Modules\User\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * UserLogoutRequest Model
 * Tracks user logout requests
 * Table: t_users_logout_request
 */
class UserLogoutRequest extends Model
{
    protected $table = 't_users_logout_request';

    protected $primaryKey = 'id';

    public $timestamps = true;
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'user_id',
        'session_id',
        'logout',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'session_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $attributes = [
        'logout' => 'NO',
    ];

    /**
     * Get the user who requested logout
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    /**
     * Get the session related to this logout request
     * Note: This references t_sessions table which should be in another module
     */
    public function session(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Session::class, 'session_id', 'id');
    }

    /**
     * Scope to filter by logout status
     */
    public function scopeStatus($query, string $status)
    {
        return $query->where('logout', $status);
    }

    /**
     * Scope to get pending logout requests
     */
    public function scopePending($query)
    {
        return $query->where('logout', 'NO');
    }

    /**
     * Scope to get completed logout requests
     */
    public function scopeCompleted($query)
    {
        return $query->where('logout', 'LOGOUT');
    }

    /**
     * Check if logout is pending
     */
    public function isPending(): bool
    {
        return $this->logout === 'NO';
    }

    /**
     * Check if logout is completed
     */
    public function isCompleted(): bool
    {
        return $this->logout === 'LOGOUT';
    }

    /**
     * Mark as logout completed
     */
    public function markAsCompleted(): void
    {
        $this->update(['logout' => 'LOGOUT']);
    }
}
