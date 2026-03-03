<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServicesImpotVerifRequest extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_services_impot_verif_request';

    /**
     * Default values for NOT NULL columns without DB defaults.
     */
    protected $attributes = [
        'reference' => '',
        'number' => '',
        'signature' => '',
        'declarant1_firstname' => '',
        'declarant1_lastname' => '',
        'declarant1_born_name' => '',
        'declarant1_born_at' => '',
        'declarant1_address1' => '',
        'declarant1_address2' => '',
        'declarant1_address3' => '',
        'declarant1_postcode' => '',
        'declarant1_city' => '',
        'declarant2_lastname' => '',
        'declarant2_firstname' => '',
        'declarant2_born_name' => '',
        'declarant2_born_at' => '',
        'declarant2_address1' => '',
        'declarant2_address2' => '',
        'declarant2_address3' => '',
        'declarant2_postcode' => '',
        'declarant2_city' => '',
        'date_recover' => '',
        'date' => '',
        'number_of_part' => 0,
        'family_situation' => '',
        'number_of_people_incharge' => 0,
        'brut_revenue' => 0,
        'fiscal_revenue_reference' => 0,
        'file' => '',
        'picture' => '',
        'is_loaded' => 'NO',
        'has_error' => 'NO',
        'status' => 'ACTIVE',
    ];

    protected $fillable = [
        'reference',
        'number',
        'status',
    ];

    public function customers(): HasMany
    {
        return $this->hasMany(ServicesImpotVerifCustomer::class, 'request_id');
    }
}
