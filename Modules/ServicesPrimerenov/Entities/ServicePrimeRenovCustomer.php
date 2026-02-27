<?php

namespace Modules\ServicesPrimerenov\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Customer\Entities\Customer;

/**
 * Service Prime Rénov Customer
 *
 * Represents a customer's PrimeRénov account linked to a Customer record.
 * Table: t_service_primerenov_customer
 *
 * Matches Symfony: modules/services_primerenov/common/lib/ServicePrimeRenovCustomer/
 *
 * @property int $id
 * @property int|null $customer_id
 * @property string|null $email
 * @property string|null $password
 * @property string|null $reference
 * @property int $amount
 * @property string|null $state1
 * @property string|null $state2
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon|null $updated_at
 */
class ServicePrimeRenovCustomer extends Model
{
    protected $table = 't_service_primerenov_customer';

    protected $fillable = [
        'customer_id',
        'email',
        'password',
        'reference',
        'amount',
        'state1',
        'state2',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'amount' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ─── Relations ───────────────────────────────────────────

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function requests(): HasMany
    {
        return $this->hasMany(ServicePrimeRenovRequest::class, 'customer_id');
    }

    // ─── Accessors ───────────────────────────────────────────

    /**
     * Get the last request (most recent by ID).
     */
    public function getLastRequestAttribute(): ?ServicePrimeRenovRequest
    {
        if ($this->relationLoaded('requests') && $this->requests->isNotEmpty()) {
            return $this->requests->sortByDesc('id')->first();
        }

        return $this->requests()->orderByDesc('id')->first();
    }
}
