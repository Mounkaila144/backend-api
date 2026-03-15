<?php

namespace Modules\CustomersMeetings\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * CustomerMeetingStatus Model (TENANT DATABASE)
 *
 * @property int $id
 * @property string $name
 * @property string $color
 * @property string $icon
 */
class CustomerMeetingStatus extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_meeting_status';

    public $timestamps = false;

    protected $fillable = ['name', 'color', 'icon'];

    public function translations(): HasMany
    {
        return $this->hasMany(CustomerMeetingStatusI18n::class, 'status_id');
    }

    public function translation($lang = 'en')
    {
        return $this->translations()->where('lang', $lang)->first();
    }

    public function getTranslatedValue($lang = 'en')
    {
        $translation = $this->translation($lang);
        return $translation ? $translation->value : $this->name;
    }

    public function meetings(): HasMany
    {
        return $this->hasMany(CustomerMeeting::class, 'state_id');
    }
}
