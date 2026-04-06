<?php

namespace Modules\CustomersMeetings\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\UsersGuard\Entities\User;

class TourGeneratorGroup extends Model
{
    protected $connection = 'tenant';
    protected $table = 't_customers_meetings_tour_generator_group';

    protected $fillable = ['tour_id', 'sale_id', 'total_distance', 'total_duration'];

    protected $casts = [
        'total_distance' => 'decimal:2',
        'total_duration' => 'integer',
    ];

    public function tour(): BelongsTo
    {
        return $this->belongsTo(TourGenerator::class, 'tour_id');
    }

    public function salesperson(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sale_id');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(TourGeneratorAssignment::class, 'group_id');
    }
}
