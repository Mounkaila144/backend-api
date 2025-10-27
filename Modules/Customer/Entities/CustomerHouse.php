<?php

namespace Modules\Customer\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerHouse extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 't_customers_house';

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
        'customer_id',
        'address_id',
        'windows',
        'orientation',
        'removal',
        'area',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'customer_id' => 'integer',
        'address_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the customer that owns the house.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'id');
    }

    /**
     * Get the address of the house.
     */
    public function address(): BelongsTo
    {
        return $this->belongsTo(CustomerAddress::class, 'address_id', 'id');
    }
}
