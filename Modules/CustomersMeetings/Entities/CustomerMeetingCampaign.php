<?php

namespace Modules\CustomersMeetings\Entities;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $name
 */
class CustomerMeetingCampaign extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_meeting_campaign';

    public $timestamps = false;

    protected $fillable = ['name'];
}
