<?php

namespace Modules\Customer\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CustomerSector extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 't_customers_sector';

    /**
     * The primary key associated with the table.
     */
    protected $primaryKey = 'id';

    /**
     * Indicates if the model should be timestamped.
     */
    public $timestamps = true;

    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'is_active',
        'status',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the departments for this sector.
     */
    public function departments(): HasMany
    {
        return $this->hasMany(CustomerSectorDept::class, 'sector_id', 'id')
            ->where('status', 'ACTIVE');
    }

    /**
     * Scope a query to only include active sectors.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE')->where('is_active', 'YES');
    }
}
