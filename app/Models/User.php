<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Modèle User pour SUPERADMIN uniquement (base centrale)
 * Pour les users des tenants, voir Modules\UsersGuard\Entities\User
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Table dans la base CENTRALE
     */
    protected $table = 't_users';

    /**
     * Connexion à la base centrale
     */
    protected $connection = 'mysql';

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
     * Scope : Uniquement les superadmin
     */
    public function scopeSuperadmin($query)
    {
        return $query->where('application', 'superadmin');
    }

    /**
     * Scope : Actifs uniquement
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', 1);
    }
}
