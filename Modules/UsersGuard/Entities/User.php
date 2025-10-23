<?php

namespace Modules\UsersGuard\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Modèle User pour les TENANTS (base du site)
 * Différent de App\Models\User (superadmin)
 */
class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    /**
     * Table dans la base TENANT
     */
    protected $table = 't_users';

    /**
     * Connexion TENANT (dynamique)
     */
    protected $connection = 'tenant';

    /**
     * Pas de timestamps Laravel
     */
    public $timestamps = false;

    /**
     * Colonnes modifiables
     */
    protected $fillable = [
        'username',
        'email',
        'password',
        'firstname',
        'lastname',
        'application',
        'is_active',
        'sex',
        'phone',
        'mobile',
    ];

    /**
     * Colonnes cachées
     */
    protected $hidden = [
        'password',
        'salt',
    ];

    /**
     * Cast des types
     */
    protected $casts = [
        'is_active' => 'boolean',
        'lastlogin' => 'datetime',
    ];

    /**
     * Relations
     */
    public function groups()
    {
        return $this->belongsToMany(
            Group::class,
            't_user_group',
            'user_id',
            'group_id'
        );
    }

    public function permissions()
    {
        return $this->belongsToMany(
            Permission::class,
            't_user_permission',
            'user_id',
            'permission_id'
        );
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', 1);
    }

    public function scopeByApplication($query, $application)
    {
        return $query->where('application', $application);
    }
}
