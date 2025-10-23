<?php

namespace Modules\UsersGuard\Entities;

use Illuminate\Database\Eloquent\Model;

class Permission extends Model
{
    protected $table = 't_permissions';
    protected $connection = 'tenant';  // 🎯 Connexion tenant
    public $timestamps = false;

    protected $fillable = [
        'name',
        'application',
        'permission_group_id',
    ];

    /**
     * Relations
     */
    public function groups()
    {
        return $this->belongsToMany(
            Group::class,
            't_group_permission',
            'permission_id',
            'group_id'
        );
    }

    public function users()
    {
        return $this->belongsToMany(
            User::class,
            't_user_permission',
            'permission_id',
            'user_id'
        );
    }

    /**
     * Scopes
     */
    public function scopeByApplication($query, $application)
    {
        return $query->where('application', $application);
    }
}
