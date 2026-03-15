<?php

namespace Modules\CustomersMeetings\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * CustomerMeetingStatusCall Model (TENANT DATABASE)
 *
 * @property int $id
 * @property string $name
 * @property string $color
 * @property string $icon
 */
class CustomerMeetingStatusCall extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_meeting_status_call';

    public $timestamps = false;

    protected $fillable = ['name', 'color', 'icon'];

    public function translations(): HasMany
    {
        return $this->hasMany(CustomerMeetingStatusCallI18n::class, 'status_id');
    }

    public function getTranslatedValue($lang = 'en')
    {
        $translation = $this->translations()->where('lang', $lang)->first();
        return $translation ? $translation->value : $this->name;
    }
}
