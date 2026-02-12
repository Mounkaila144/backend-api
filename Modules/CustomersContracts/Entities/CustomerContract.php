<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Customer\Entities\Customer;
use Modules\Partner\Entities\Partner;
use Modules\PartnerLayer\Entities\PartnerLayerCompany;
use Modules\PartnerPolluter\Entities\PartnerPolluterCompany;
use Modules\Product\Entities\Tax;
use Modules\User\Entities\UserTeam;
use Modules\UsersGuard\Entities\User;

/**
 * CustomerContract Model (TENANT DATABASE)
 *
 * @property int $id
 * @property string $reference
 * @property int $customer_id
 * @property int|null $meeting_id
 * @property int $financial_partner_id
 * @property int $tax_id
 * @property int $team_id
 * @property int $telepro_id
 * @property int $sale_1_id
 * @property int $sale_2_id
 * @property int $manager_id
 * @property int $assistant_id
 * @property int|null $created_by_id
 * @property int|null $installer_user_id
 * @property int|null $polluter_id
 * @property int|null $partner_layer_id
 * @property int|null $opc_status_id
 * @property int|null $time_state_id
 * @property int|null $company_id
 * @property int|null $campaign_id
 * @property string|null $opened_at
 * @property int $opened_at_range_id
 * @property string|null $sent_at
 * @property string|null $payment_at
 * @property string|null $opc_at
 * @property int|null $opc_range_id
 * @property string|null $sav_at
 * @property int|null $sav_at_range_id
 * @property string|null $apf_at
 * @property string|null $closed_at
 * @property string|null $signed_at
 * @property string|null $pre_meeting_at
 * @property int $state_id
 * @property int|null $install_state_id
 * @property int|null $admin_status_id
 * @property string $total_price_with_taxe
 * @property string $total_price_without_taxe
 * @property string $remarks
 * @property string $variables
 * @property string $is_signed
 * @property string $is_confirmed
 * @property string $is_hold
 * @property string $is_hold_admin
 * @property string $is_hold_quote
 * @property string $is_billable
 * @property string $is_document
 * @property string $is_photo
 * @property string $is_quality
 * @property string $status (ACTIVE/DELETE/INPROGRESS)
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class CustomerContract extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_contract';

    protected $fillable = [
        'reference',
        'customer_id',
        'meeting_id',
        'financial_partner_id',
        'tax_id',
        'team_id',
        'telepro_id',
        'sale_1_id',
        'sale_2_id',
        'manager_id',
        'assistant_id',
        'created_by_id',
        'installer_user_id',
        'polluter_id',
        'partner_layer_id',
        'opc_status_id',
        'time_state_id',
        'company_id',
        'campaign_id',
        'quoted_at',
        'billing_at',
        'opened_at',
        'opened_at_range_id',
        'sent_at',
        'payment_at',
        'opc_at',
        'opc_range_id',
        'sav_at',
        'sav_at_range_id',
        'apf_at',
        'closed_at',
        'signed_at',
        'pre_meeting_at',
        'state_id',
        'install_state_id',
        'admin_status_id',
        'total_price_with_taxe',
        'total_price_without_taxe',
        'remarks',
        'variables',
        'is_signed',
        'is_confirmed',
        'is_hold',
        'is_hold_admin',
        'is_hold_quote',
        'is_billable',
        'is_document',
        'is_photo',
        'is_quality',
        'status',
        'mensuality',
        'advance_payment',
    ];

    protected $casts = [
        'quoted_at' => 'date',
        'billing_at' => 'date',
        'opened_at' => 'date',
        'sent_at' => 'datetime',
        'payment_at' => 'date',
        'opc_at' => 'datetime',
        'sav_at' => 'datetime',
        'apf_at' => 'date',
        'closed_at' => 'datetime',
        'signed_at' => 'date',
        'pre_meeting_at' => 'datetime',
        'total_price_with_taxe' => 'decimal:2',
        'total_price_without_taxe' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $attributes = [
        'tax_id' => 0,
        'team_id' => 0,
        'telepro_id' => 0,
        'sale_1_id' => 0,
        'sale_2_id' => 0,
        'manager_id' => 0,
        'assistant_id' => 0,
        'opened_at_range_id' => 1,
        'sav_at_range_id' => 1,
        'state_id' => 52,
        'opc_range_id' => 1,
        'mensuality' => 0,
        'advance_payment' => 0,
        'remarks' => '',
        'variables' => '',
    ];

    // ─── Scopes ──────────────────────────────────────────────

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

    public function scopeSigned($query, $signed = true)
    {
        return $query->where('is_signed', $signed ? 'YES' : 'NO');
    }

    // ─── Relations: Customer ─────────────────────────────────

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    // ─── Relations: Users (telepro, sale1, sale2, assistant, manager, creator, installer) ──

    public function telepro(): BelongsTo
    {
        return $this->belongsTo(User::class, 'telepro_id');
    }

    public function sale1(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sale_1_id');
    }

    public function sale2(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sale_2_id');
    }

    public function assistant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assistant_id');
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function installerUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'installer_user_id');
    }

    // ─── Relations: Team ─────────────────────────────────────

    public function team(): BelongsTo
    {
        return $this->belongsTo(UserTeam::class, 'team_id');
    }

    // ─── Relations: Statuses ─────────────────────────────────

    public function contractStatus(): BelongsTo
    {
        return $this->belongsTo(CustomerContractStatus::class, 'state_id');
    }

    public function installStatus(): BelongsTo
    {
        return $this->belongsTo(CustomerContractInstallStatus::class, 'install_state_id');
    }

    public function adminStatus(): BelongsTo
    {
        return $this->belongsTo(CustomerContractAdminStatus::class, 'admin_status_id');
    }

    public function opcStatus(): BelongsTo
    {
        return $this->belongsTo(CustomerContractOpcStatus::class, 'opc_status_id');
    }

    public function timeStatus(): BelongsTo
    {
        return $this->belongsTo(CustomerContractTimeStatus::class, 'time_state_id');
    }

    // ─── Relations: Partners ─────────────────────────────────

    public function financialPartner(): BelongsTo
    {
        return $this->belongsTo(Partner::class, 'financial_partner_id');
    }

    public function partnerLayer(): BelongsTo
    {
        return $this->belongsTo(PartnerLayerCompany::class, 'partner_layer_id');
    }

    public function polluter(): BelongsTo
    {
        return $this->belongsTo(PartnerPolluterCompany::class, 'polluter_id');
    }

    // ─── Relations: Company & Tax ────────────────────────────

    public function company(): BelongsTo
    {
        return $this->belongsTo(CustomerContractCompany::class, 'company_id');
    }

    public function tax(): BelongsTo
    {
        return $this->belongsTo(Tax::class, 'tax_id');
    }

    // ─── Relations: Campaign ────────────────────────────────

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(CustomerContractCampaign::class, 'campaign_id');
    }

    // ─── Relations: Date Ranges ────────────────────────────

    public function opcRange(): BelongsTo
    {
        return $this->belongsTo(CustomerContractDateRange::class, 'opc_range_id');
    }

    public function savAtRange(): BelongsTo
    {
        return $this->belongsTo(CustomerContractDateRange::class, 'sav_at_range_id');
    }

    // ─── Relations: Domoprime (filter-only) ─────────────────

    public function domoprimeQuotation(): HasMany
    {
        return $this->hasMany(DomoprimeQuotation::class, 'contract_id');
    }

    public function domoprimeCalculation(): HasMany
    {
        return $this->hasMany(DomoprimeCalculation::class, 'contract_id');
    }

    public function domoprimeIsoRequest(): HasMany
    {
        return $this->hasMany(DomoprimeIsoCustomerRequest::class, 'contract_id');
    }

    public function domoprimeDocumentForm(): HasMany
    {
        return $this->hasMany(DomoprimeDocumentForm::class, 'contract_id');
    }

    // ─── Relations: HasMany ──────────────────────────────────

    public function products(): HasMany
    {
        return $this->hasMany(CustomerContractProduct::class, 'contract_id');
    }

    public function history(): HasMany
    {
        return $this->hasMany(CustomerContractHistory::class, 'contract_id');
    }

    public function contributors(): HasMany
    {
        return $this->hasMany(CustomerContractContributor::class, 'contract_id');
    }

    // ─── Accessors ───────────────────────────────────────────

    public function getVariablesArrayAttribute()
    {
        return $this->variables ? json_decode($this->variables, true) : [];
    }

    public function setVariablesArrayAttribute($value)
    {
        $this->attributes['variables'] = is_array($value) ? json_encode($value) : $value;
    }
}
