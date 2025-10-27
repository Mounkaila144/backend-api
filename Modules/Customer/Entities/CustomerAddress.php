<?php

namespace Modules\Customer\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CustomerAddress extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 't_customers_address';

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
        'signature',
        'lat',
        'lng',
        'address1',
        'address2',
        'postcode',
        'city',
        'country',
        'state',
        'coordinates',
        'status',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'customer_id' => 'integer',
        'lat' => 'decimal:13',
        'lng' => 'decimal:13',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the customer that owns the address.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'id');
    }

    /**
     * Get the houses associated with this address.
     */
    public function houses(): HasMany
    {
        return $this->hasMany(CustomerHouse::class, 'address_id', 'id');
    }

    /**
     * Scope a query to only include active addresses.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE');
    }

    /**
     * Get the full address as a string.
     */
    public function getFullAddressAttribute(): string
    {
        $parts = array_filter([
            $this->address1,
            $this->address2,
            $this->postcode,
            $this->city,
            $this->state,
            $this->country,
        ]);

        return implode(', ', $parts);
    }

    /**
     * Generate address signature before saving.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($address) {
            if (empty($address->signature)) {
                $address->signature = $address->generateSignature();
            }
        });

        static::updating(function ($address) {
            if ($address->isDirty(['address1', 'address2', 'postcode', 'city'])) {
                $address->signature = $address->generateSignature();
            }
        });
    }

    /**
     * Generate a unique signature for the address.
     */
    public function generateSignature(): string
    {
        $addressString = strtoupper(
            str_replace(
                [' ', ','],
                '',
                implode('', [
                    $this->address1,
                    $this->address2,
                    $this->postcode,
                    $this->city,
                ])
            )
        );

        return sha1($addressString);
    }
}