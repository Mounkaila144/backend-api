<?php

namespace Modules\UsersGuard\Entities;

use Illuminate\Database\Eloquent\Model;

class Group extends Model
{
    protected $table = 't_groups';
    protected $connection = 'tenant';  // 🎯 Connexion tenant
    public $timestamps = false;

    protected $fillable = [
        'name',
        'application',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Relations
     */
    public function users()
    {
        return $this->belongsToMany(
            User::class,
            't_user_group',
            'group_id',
            'user_id'
        );
    }

    public function permissions()
    {
        return $this->belongsToMany(
            Permission::class,
            't_group_permission',
            'group_id',
            'permission_id'
        );
    }

    /**
     * Scopes
     */
    public function scopeByApplication($query, $application)
    {
        return $query->where('application', $application);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', 1);
    }
}
