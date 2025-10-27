<?php

namespace Modules\Customer\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Customer extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 't_customers';

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
        'company',
        'gender',
        'firstname',
        'lastname',
        'email',
        'phone',
        'mobile',
        'mobile2',
        'phone1',
        'birthday',
        'union_id',
        'age',
        'salary',
        'occupation',
        'status',
        'token',
        'token_expiration',
        'token_attempts',
        'salt',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'birthday' => 'date',
        'token_expiration' => 'datetime',
        'token_attempts' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'token',
        'salt',
    ];

    /**
     * Get the addresses for the customer.
     */
    public function addresses(): HasMany
    {
        return $this->hasMany(CustomerAddress::class, 'customer_id', 'id')
            ->where('status', 'ACTIVE');
    }

    /**
     * Get all addresses including deleted ones.
     */
    public function allAddresses(): HasMany
    {
        return $this->hasMany(CustomerAddress::class, 'customer_id', 'id');
    }

    /**
     * Get the contacts for the customer.
     */
    public function contacts(): HasMany
    {
        return $this->hasMany(CustomerContact::class, 'customer_id', 'id')
            ->where('status', 'ACTIVE');
    }

    /**
     * Get the primary contact for the customer.
     */
    public function primaryContact(): HasOne
    {
        return $this->hasOne(CustomerContact::class, 'customer_id', 'id')
            ->where('isFirst', 'YES')
            ->where('status', 'ACTIVE');
    }

    /**
     * Get the house information for the customer.
     */
    public function houses(): HasMany
    {
        return $this->hasMany(CustomerHouse::class, 'customer_id', 'id');
    }

    /**
     * Get the financial information for the customer.
     */
    public function financial(): HasOne
    {
        return $this->hasOne(CustomerFinancial::class, 'customer_id', 'id');
    }

    /**
     * Get the union that the customer belongs to.
     */
    public function union(): BelongsTo
    {
        return $this->belongsTo(CustomerUnion::class, 'union_id', 'id');
    }

    /**
     * Scope a query to only include active customers.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE');
    }

    /**
     * Scope a query to search customers by name, email, or phone.
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('firstname', 'like', "%{$search}%")
                ->orWhere('lastname', 'like', "%{$search}%")
                ->orWhere('company', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%")
                ->orWhere('mobile', 'like', "%{$search}%");
        });
    }

    /**
     * Get the customer's full name.
     */
    public function getFullNameAttribute(): string
    {
        $parts = array_filter([
            $this->gender,
            $this->firstname,
            $this->lastname,
        ]);

        return implode(' ', $parts);
    }

    /**
     * Get the customer's display name (company or full name).
     */
    public function getDisplayNameAttribute(): string
    {
        return $this->company ?: $this->full_name;
    }
}