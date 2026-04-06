<?php

namespace Modules\CustomersMeetings\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TourGenerator extends Model
{
    protected $connection = 'tenant';
    protected $table = 't_customers_meetings_tour_generator';

    protected $fillable = ['date', 'status'];

    protected $casts = [
        'date' => 'date',
    ];

    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE');
    }

    public function groups(): HasMany
    {
        return $this->hasMany(TourGeneratorGroup::class, 'tour_id');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(TourGeneratorAssignment::class, 'tour_id');
    }

    public function distanceMatrix(): HasMany
    {
        return $this->hasMany(TourGeneratorDistanceMatrix::class, 'tour_id');
    }

    public function setActive(): self
    {
        $this->update(['status' => 'ACTIVE']);
        return $this;
    }

    public function getGroupsWithMeetings()
    {
        return $this->groups()->with([
            'assignments' => fn ($q) => $q->orderBy('order_in_group'),
            'assignments.meeting.customer.addresses' => fn ($q) => $q->where('status', 'ACTIVE'),
            'salesperson:id,firstname,lastname',
        ])->get();
    }
}
