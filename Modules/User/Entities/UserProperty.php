<?php

namespace Modules\User\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * UserProperty Model
 * Stores custom properties/settings for users
 * Table: t_user_property
 */
class UserProperty extends Model
{
    protected $table = 't_user_property';

    protected $primaryKey = 'id';

    public $timestamps = true;
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'name',
        'parameters',
        'user_id',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'parameters' => 'array', // JSON casting for TEXT field
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user that owns this property
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    /**
     * Scope to get properties by name
     */
    public function scopeByName($query, string $name)
    {
        return $query->where('name', $name);
    }

    /**
     * Scope to get properties for a specific user
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Get a parameter value by key
     */
    public function getParameter(string $key, $default = null)
    {
        $parameters = $this->parameters ?? [];
        return $parameters[$key] ?? $default;
    }

    /**
     * Set a parameter value
     */
    public function setParameter(string $key, $value): void
    {
        $parameters = $this->parameters ?? [];
        $parameters[$key] = $value;
        $this->parameters = $parameters;
    }
}
