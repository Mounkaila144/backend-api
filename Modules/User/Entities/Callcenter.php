<?php

namespace Modules\User\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Callcenter Model
 * Represents a call center location
 * Table: t_callcenter
 */
class Callcenter extends Model
{
    protected $table = 't_callcenter';

    protected $primaryKey = 'id';

    public $timestamps = false;

    protected $fillable = [
        'name',
    ];

    /**
     * Get all users in this callcenter
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'callcenter_id', 'id');
    }

    /**
     * Scope to search by name
     */
    public function scopeSearch($query, string $search)
    {
        if (empty($search)) {
            return $query;
        }

        return $query->where('name', 'LIKE', "%{$search}%");
    }
}
