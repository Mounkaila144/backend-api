<?php

namespace Modules\Customer\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerContact extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 't_customers_contact';

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
        'gender',
        'firstname',
        'lastname',
        'email',
        'phone',
        'mobile',
        'birthday',
        'age',
        'salary',
        'occupation',
        'isFirst',
        'status',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'customer_id' => 'integer',
        'birthday' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the customer that owns the contact.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'id');
    }

    /**
     * Scope a query to only include active contacts.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE');
    }

    /**
     * Scope a query to only include primary contacts.
     */
    public function scopePrimary($query)
    {
        return $query->where('isFirst', 'YES');
    }

    /**
     * Get the contact's full name.
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
}
