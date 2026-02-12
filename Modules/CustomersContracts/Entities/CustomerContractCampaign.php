<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;

/**
 * CustomerContractCampaign Model (TENANT DATABASE)
 *
 * Maps to the existing Symfony table t_customers_meeting_campaign.
 *
 * @property int $id
 * @property string $name
 * @property string $status
 */
class CustomerContractCampaign extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_meeting_campaign';

    public $timestamps = false;

    protected $fillable = [
        'name',
        'status',
    ];
}
