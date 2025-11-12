<?php

namespace Modules\User\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * UserValidationToken Model
 * Stores validation tokens for email verification, password reset, etc.
 * Table: t_users_validation_token
 */
class UserValidationToken extends Model
{
    protected $table = 't_users_validation_token';

    protected $primaryKey = 'id';

    public $timestamps = true;
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'token',
        'type',
        'message',
        'callback',
        'user_id',
        'status',
        'validation_email',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $attributes = [
        'status' => 'ACTIVE',
        'validation_email' => '',
    ];

    /**
     * Get the user associated with this validation token
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    /**
     * Scope to filter by token type
     */
    public function scopeType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope to filter by status
     */
    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to get active tokens
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE');
    }

    /**
     * Scope to get deleted/expired tokens
     */
    public function scopeDeleted($query)
    {
        return $query->where('status', 'DELETE');
    }

    /**
     * Scope to find by token string
     */
    public function scopeByToken($query, string $token)
    {
        return $query->where('token', $token);
    }

    /**
     * Check if token is active
     */
    public function isActive(): bool
    {
        return $this->status === 'ACTIVE';
    }

    /**
     * Check if token is deleted/expired
     */
    public function isDeleted(): bool
    {
        return $this->status === 'DELETE';
    }

    /**
     * Mark token as deleted/expired
     */
    public function markAsDeleted(): void
    {
        $this->update(['status' => 'DELETE']);
    }

    /**
     * Generate a random validation token
     */
    public static function generateToken(): string
    {
        return bin2hex(random_bytes(32));
    }
}
