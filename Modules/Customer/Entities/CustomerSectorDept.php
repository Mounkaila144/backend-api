<?php

namespace Modules\Customer\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerSectorDept extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 't_customers_sector_dept';

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
        'sector_id',
        'name',
        'is_active',
        'status',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'sector_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the sector that owns the department.
     */
    public function sector(): BelongsTo
    {
        return $this->belongsTo(CustomerSector::class, 'sector_id', 'id');
    }

    /**
     * Scope a query to only include active departments.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE')->where('is_active', 'YES');
    }
}
