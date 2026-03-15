<?php

namespace Modules\CustomersMeetings\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Modules\Customer\Entities\Customer;
use Modules\CustomersMeetings\Services\MeetingSettingsService;
use Modules\PartnerLayer\Entities\PartnerLayerCompany;
use Modules\PartnerPolluter\Entities\PartnerPolluterCompany;
use Modules\UsersGuard\Entities\User;

/**
 * CustomerMeeting Model (TENANT DATABASE)
 *
 * @property int $id
 * @property string $registration
 * @property int|null $customer_id
 * @property int $telepro_id
 * @property int $sales_id
 * @property int $sale2_id
 * @property int|null $company_id
 * @property int $assistant_id
 * @property int|null $polluter_id
 * @property int|null $partner_layer_id
 * @property string|null $in_at
 * @property int $in_at_range_id
 * @property string|null $out_at
 * @property string|null $callback_at
 * @property string $is_callback_cancelled
 * @property string|null $callback_cancel_at
 * @property int $state_id
 * @property int $status_lead_id
 * @property int $status_call_id
 * @property int|null $campaign_id
 * @property int $callcenter_id
 * @property int $type_id
 * @property int $confirmator_id
 * @property int|null $opc_range_id
 * @property string $remarks
 * @property string $sale_comments
 * @property string $turnover
 * @property string $variables
 * @property string $status (ACTIVE/DELETE/INPROGRESS)
 * @property string $is_confirmed (YES/NO)
 * @property string $is_hold (YES/NO)
 * @property string $is_hold_quote (YES/NO)
 * @property string $is_qualified (YES/NO)
 * @property string $is_works_hold (Y/N)
 * @property string $is_locked (YES/NO)
 * @property string|null $lock_time
 * @property int $lock_user_id
 * @property \Carbon\Carbon $created_at
 * @property string $creation_at
 * @property string|null $treated_at
 * @property string|null $confirmed_at
 * @property string|null $state_updated_at
 * @property string|null $opc_at
 * @property int $confirmed_by_id
 * @property int|null $created_by_id
 * @property \Carbon\Carbon $updated_at
 */
class CustomerMeeting extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_meeting';

    protected $fillable = [
        'registration',
        'customer_id',
        'telepro_id',
        'sales_id',
        'sale2_id',
        'company_id',
        'assistant_id',
        'polluter_id',
        'partner_layer_id',
        'in_at',
        'in_at_range_id',
        'out_at',
        'callback_at',
        'is_callback_cancelled',
        'callback_cancel_at',
        'state_id',
        'status_lead_id',
        'status_call_id',
        'campaign_id',
        'callcenter_id',
        'type_id',
        'confirmator_id',
        'opc_range_id',
        'remarks',
        'sale_comments',
        'turnover',
        'variables',
        'status',
        'is_confirmed',
        'is_hold',
        'is_hold_quote',
        'is_qualified',
        'is_works_hold',
        'is_locked',
        'lock_time',
        'lock_user_id',
        'creation_at',
        'treated_at',
        'confirmed_at',
        'state_updated_at',
        'opc_at',
        'confirmed_by_id',
        'created_by_id',
    ];

    protected $casts = [
        'in_at' => 'datetime',
        'out_at' => 'datetime',
        'callback_at' => 'datetime',
        'callback_cancel_at' => 'datetime',
        'lock_time' => 'datetime',
        'creation_at' => 'datetime',
        'treated_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'state_updated_at' => 'datetime',
        'opc_at' => 'datetime',
        'turnover' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $attributes = [
        'telepro_id' => 0,
        'sales_id' => 0,
        'sale2_id' => 0,
        'assistant_id' => 0,
        'state_id' => 0,
        'status_lead_id' => 0,
        'status_call_id' => 0,
        'callcenter_id' => 0,
        'type_id' => 0,
        'confirmator_id' => 0,
        'confirmed_by_id' => 0,
        'lock_user_id' => 0,
        'in_at_range_id' => 0,
        'registration' => '',
        'remarks' => '',
        'sale_comments' => '',
        'variables' => '',
        'turnover' => 0,
    ];

    // --- Scopes ---

    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE');
    }

    public function scopeDeleted($query)
    {
        return $query->where('status', 'DELETE');
    }

    public function scopeNotInProgress($query)
    {
        return $query->where('status', '!=', 'INPROGRESS');
    }

    public function scopeConfirmed($query, $confirmed = true)
    {
        return $query->where('is_confirmed', $confirmed ? 'YES' : 'NO');
    }

    // --- Relations: Customer ---

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    // --- Relations: Users ---

    public function telepro(): BelongsTo
    {
        return $this->belongsTo(User::class, 'telepro_id');
    }

    public function sales(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sales_id');
    }

    public function sale2(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sale2_id');
    }

    public function assistant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assistant_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function confirmedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by_id');
    }

    public function confirmator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmator_id');
    }

    public function lockUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'lock_user_id');
    }

    // --- Relations: Statuses ---

    public function meetingStatus(): BelongsTo
    {
        return $this->belongsTo(CustomerMeetingStatus::class, 'state_id');
    }

    public function statusCall(): BelongsTo
    {
        return $this->belongsTo(CustomerMeetingStatusCall::class, 'status_call_id');
    }

    public function statusLead(): BelongsTo
    {
        return $this->belongsTo(CustomerMeetingStatusLead::class, 'status_lead_id');
    }

    // --- Relations: Type & Campaign ---

    public function meetingType(): BelongsTo
    {
        return $this->belongsTo(CustomerMeetingType::class, 'type_id');
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(CustomerMeetingCampaign::class, 'campaign_id');
    }

    // --- Relations: Partners ---

    public function partnerLayer(): BelongsTo
    {
        return $this->belongsTo(PartnerLayerCompany::class, 'partner_layer_id');
    }

    public function polluter(): BelongsTo
    {
        return $this->belongsTo(PartnerPolluterCompany::class, 'polluter_id');
    }

    // --- Relations: Company ---

    public function company(): BelongsTo
    {
        return $this->belongsTo(\Modules\CustomersContracts\Entities\CustomerContractCompany::class, 'company_id');
    }

    // --- Relations: Callcenter ---

    public function callcenter(): BelongsTo
    {
        return $this->belongsTo(\Modules\User\Entities\Callcenter::class, 'callcenter_id');
    }

    // --- Relations: Date Ranges ---

    public function opcRange(): BelongsTo
    {
        return $this->belongsTo('Modules\CustomersContracts\Entities\CustomerContractDateRange', 'opc_range_id');
    }

    public function inAtRange(): BelongsTo
    {
        return $this->belongsTo(CustomerMeetingDateRange::class, 'in_at_range_id');
    }

    // --- Relations: HasMany ---

    public function products(): HasMany
    {
        return $this->hasMany(CustomerMeetingProduct::class, 'meeting_id');
    }

    public function history(): HasMany
    {
        return $this->hasMany(CustomerMeetingHistory::class, 'customer_id', 'customer_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(CustomerMeetingComment::class, 'meeting_id');
    }

    public function domoprimeRequest(): HasOne
    {
        return $this->hasOne(\Modules\AppDomoprime\Entities\DomoprimeIsoCustomerRequest::class, 'meeting_id');
    }

    // --- Accessors ---

    public function getVariablesArrayAttribute()
    {
        return $this->variables ? json_decode($this->variables, true) : [];
    }

    public function setVariablesArrayAttribute($value)
    {
        $this->attributes['variables'] = is_array($value) ? json_encode($value) : $value;
    }

    // --- State Checks ---

    public function isHold(): bool
    {
        return $this->is_hold === 'YES';
    }

    public function isConfirmed(): bool
    {
        return $this->is_confirmed === 'YES';
    }

    public function isHoldQuote(): bool
    {
        return $this->is_hold_quote === 'YES';
    }

    public function isLocked(): bool
    {
        return $this->is_locked === 'YES';
    }

    public function isQualified(): bool
    {
        return $this->is_qualified === 'YES';
    }

    public function hasPolluter(): bool
    {
        return $this->polluter_id !== null;
    }

    // --- State Transitions ---

    public function setConfirmed(MeetingSettingsService $settings): self
    {
        $this->is_confirmed = 'YES';
        $this->confirmed_at = now();

        $statusId = $settings->getStatusForConfirm();
        if ($statusId) {
            $this->state_id = $statusId;
        }

        $this->save();
        return $this;
    }

    public function setUnconfirmed(MeetingSettingsService $settings): self
    {
        $this->is_confirmed = 'NO';

        $statusId = $settings->getStatusForUnconfirm();
        if ($statusId) {
            $this->state_id = $statusId;
        }

        $this->save();
        return $this;
    }

    public function setCancelled(MeetingSettingsService $settings): self
    {
        $statusId = $settings->getStatusForCancel();
        if ($statusId) {
            $this->state_id = $statusId;
        }

        $this->save();
        return $this;
    }

    public function setUncancelled(MeetingSettingsService $settings): self
    {
        $statusId = $settings->getStatusForUncancel();
        if ($statusId) {
            $this->state_id = $statusId;
        }

        $this->save();
        return $this;
    }

    public function setHold(): self
    {
        $this->update(['is_hold' => 'YES']);
        return $this;
    }

    public function setUnhold(): self
    {
        $this->update(['is_hold' => 'NO']);
        return $this;
    }

    public function setHoldQuote(): self
    {
        $this->update(['is_hold_quote' => 'YES']);
        return $this;
    }

    public function setUnholdQuote(): self
    {
        $this->update(['is_hold_quote' => 'NO']);
        return $this;
    }

    public function setLocked(int $userId): self
    {
        $this->update([
            'is_locked' => 'YES',
            'lock_user_id' => $userId,
            'lock_time' => now(),
        ]);
        return $this;
    }

    public function setUnlocked(): self
    {
        $this->update([
            'is_locked' => 'NO',
            'lock_user_id' => 0,
            'lock_time' => null,
        ]);
        return $this;
    }

    public function cancelCallback(): self
    {
        $this->update([
            'is_callback_cancelled' => 'YES',
            'callback_cancel_at' => now(),
        ]);
        return $this;
    }

    /**
     * Duplicate meeting with its products.
     */
    public function copy(): self
    {
        $newMeeting = $this->replicate();
        $newMeeting->is_confirmed = 'NO';
        $newMeeting->is_hold = 'NO';
        $newMeeting->is_hold_quote = 'NO';
        $newMeeting->is_locked = 'NO';
        $newMeeting->lock_user_id = 0;
        $newMeeting->lock_time = null;

        // Clean invalid datetime values (0000-00-00 00:00:00)
        foreach (['out_at', 'in_at', 'callback_at', 'treated_at', 'confirmed_at', 'opc_at', 'callback_cancel_at', 'state_updated_at'] as $dateField) {
            $raw = $this->getRawOriginal($dateField);
            if ($raw === '0000-00-00 00:00:00' || $raw === '-0001-11-30 00:00:00') {
                $newMeeting->$dateField = null;
            }
        }

        $newMeeting->save();

        foreach ($this->products as $product) {
            $newMeeting->products()->create([
                'product_id' => $product->product_id,
                'details' => $product->details,
            ]);
        }

        return $newMeeting;
    }
}
