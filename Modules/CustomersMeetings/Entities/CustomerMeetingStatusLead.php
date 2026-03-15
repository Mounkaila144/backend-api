<?php

namespace Modules\CustomersMeetings\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string $color
 * @property string $icon
 */
class CustomerMeetingStatusLead extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_meeting_status_lead';

    public $timestamps = false;

    protected $fillable = ['name', 'color', 'icon'];

    public function translations(): HasMany
    {
        return $this->hasMany(CustomerMeetingStatusLeadI18n::class, 'status_id');
    }

    public function getTranslatedValue($lang = 'en')
    {
        $translation = $this->translations()->where('lang', $lang)->first();
        return $translation ? $translation->value : $this->name;
    }
}
