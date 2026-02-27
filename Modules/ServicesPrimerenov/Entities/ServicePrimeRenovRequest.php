<?php

namespace Modules\ServicesPrimerenov\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Service Prime Rénov Request
 *
 * Represents an individual PrimeRénov application/request.
 * Table: t_service_primerenov_request
 *
 * Matches Symfony: modules/services_primerenov/common/lib/ServicePrimeRenovRequest/
 *
 * @property int $id
 * @property int|null $customer_id  FK to t_service_primerenov_customer
 * @property string|null $number
 * @property string|null $date
 * @property int $amount
 * @property string|null $state1
 * @property string|null $state2
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon|null $updated_at
 */
class ServicePrimeRenovRequest extends Model
{
    protected $table = 't_service_primerenov_request';

    protected $fillable = [
        'customer_id',
        'number',
        'date',
        'amount',
        'state1',
        'state2',
    ];

    protected $casts = [
        'date' => 'date',
        'amount' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ─── Relations ───────────────────────────────────────────

    public function primeRenovCustomer(): BelongsTo
    {
        return $this->belongsTo(ServicePrimeRenovCustomer::class, 'customer_id');
    }
}
