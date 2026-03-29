<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\User\Entities\User;

/**
 * @property int $id
 * @property int $comment_id
 * @property int $user_id
 * @property string $user_application
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class CustomerContractCommentHistory extends Model
{
    protected $connection = 'tenant';
    protected $table = 't_customers_contracts_comments_history';

    protected $fillable = [
        'comment_id',
        'user_id',
        'user_application',
    ];

    public function comment(): BelongsTo
    {
        return $this->belongsTo(CustomerContractComment::class, 'comment_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
