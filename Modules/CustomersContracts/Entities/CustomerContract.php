<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Customer\Entities\Customer;

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
 * @property string|null $opened_at
 * @property int $opened_at_range_id
 * @property string|null $sent_at
 * @property string|null $payment_at
 * @property string|null $opc_at
 * @property int|null $opc_range_id
 * @property string|null $apf_at
 * @property int $state_id
 * @property int|null $install_state_id
 * @property int|null $admin_status_id
 * @property string $total_price_with_taxe
 * @property string $total_price_without_taxe
 * @property string $remarks
 * @property string $variables
 * @property string $is_signed
 * @property string $status (ACTIVE/DELETE)
 * @property int|null $company_id
 * @property int|null $installer_user_id
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
        'opened_at',
        'opened_at_range_id',
        'sent_at',
        'payment_at',
        'opc_at',
        'opc_range_id',
        'apf_at',
        'state_id',
        'install_state_id',
        'admin_status_id',
        'total_price_with_taxe',
        'total_price_without_taxe',
        'remarks',
        'variables',
        'is_signed',
        'status',
        'company_id',
        'installer_user_id',
    ];

    protected $casts = [
        'opened_at' => 'date',
        'sent_at' => 'datetime',
        'payment_at' => 'date',
        'opc_at' => 'datetime',
        'apf_at' => 'date',
        'total_price_with_taxe' => 'decimal:2',
        'total_price_without_taxe' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Scope to only get active contracts
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE');
    }

    /**
     * Scope to only get deleted contracts
     */
    public function scopeDeleted($query)
    {
        return $query->where('status', 'DELETE');
    }

    /**
     * Scope to filter by signed status
     */
    public function scopeSigned($query, $signed = true)
    {
        return $query->where('is_signed', $signed ? 'YES' : 'NO');
    }

    /**
     * Get the customer that owns the contract
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    /**
     * Get the contract status
     */
    public function contractStatus(): BelongsTo
    {
        return $this->belongsTo(CustomerContractStatus::class, 'state_id');
    }

    /**
     * Alias for backward compatibility
     * @deprecated Use contractStatus() instead
     */
    public function status(): BelongsTo
    {
        return $this->contractStatus();
    }

    /**
     * Get the installation status
     */
    public function installStatus(): BelongsTo
    {
        return $this->belongsTo(CustomerContractInstallStatus::class, 'install_state_id');
    }

    /**
     * Get the admin status
     */
    public function adminStatus(): BelongsTo
    {
        return $this->belongsTo(CustomerContractAdminStatus::class, 'admin_status_id');
    }

    /**
     * Get the contract products
     */
    public function products(): HasMany
    {
        return $this->hasMany(CustomerContractProduct::class, 'contract_id');
    }

    /**
     * Get the contract history
     */
    public function history(): HasMany
    {
        return $this->hasMany(CustomerContractHistory::class, 'contract_id');
    }

    /**
     * Get the contract contributors
     */
    public function contributors(): HasMany
    {
        return $this->hasMany(CustomerContractContributor::class, 'contract_id');
    }

    /**
     * Get parsed variables as array
     */
    public function getVariablesArrayAttribute()
    {
        return $this->variables ? json_decode($this->variables, true) : [];
    }

    /**
     * Set variables from array
     */
    public function setVariablesArrayAttribute($value)
    {
        $this->attributes['variables'] = is_array($value) ? json_encode($value) : $value;
    }
}
