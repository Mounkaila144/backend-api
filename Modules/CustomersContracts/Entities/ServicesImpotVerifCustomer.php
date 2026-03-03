<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServicesImpotVerifCustomer extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_services_impot_verif_customer';

    protected $fillable = [
        'customer_id',
        'request_id',
    ];

    public function request(): BelongsTo
    {
        return $this->belongsTo(ServicesImpotVerifRequest::class, 'request_id');
    }
}
