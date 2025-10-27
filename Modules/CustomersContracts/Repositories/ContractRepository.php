<?php

namespace Modules\CustomersContracts\Repositories;

use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Modules\CustomersContracts\Entities\CustomerContract;
use Modules\CustomersContracts\Entities\CustomerContractHistory;

/**
 * Contract Repository
 *
 * Handles all database operations for customer contracts
 */
class ContractRepository
{
    /**
     * Get filtered contracts with pagination
     *
     * @param array $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getFilteredContracts(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = CustomerContract::query()
            ->with([
                'customer',
                'status',
                'installStatus',
                'adminStatus',
                'products',
            ]);

        // Apply filters
        $this->applyFilters($query, $filters);

        // Apply sorting
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($perPage);
    }

    /**
     * Apply filters to query
     *
     * @param $query
     * @param array $filters
     * @return void
     */
    protected function applyFilters($query, array $filters): void
    {
        // Reference search
        if (! empty($filters['reference'])) {
            $query->where('reference', 'like', '%'.$filters['reference'].'%');
        }

        // Customer ID
        if (! empty($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }

        // Status filters
        if (! empty($filters['state_id'])) {
            $query->where('state_id', $filters['state_id']);
        }

        if (! empty($filters['install_state_id'])) {
            $query->where('install_state_id', $filters['install_state_id']);
        }

        if (! empty($filters['admin_status_id'])) {
            $query->where('admin_status_id', $filters['admin_status_id']);
        }

        // Signature status
        if (! empty($filters['is_signed'])) {
            $query->where('is_signed', $filters['is_signed']);
        }

        // Active/Delete status (default to ACTIVE only)
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        } else {
            $query->where('status', 'ACTIVE');
        }

        // Date range filters - opened_at
        if (! empty($filters['opened_at_from'])) {
            $query->where('opened_at', '>=', $filters['opened_at_from']);
        }

        if (! empty($filters['opened_at_to'])) {
            $query->where('opened_at', '<=', $filters['opened_at_to']);
        }

        // Date range filters - payment_at
        if (! empty($filters['payment_at_from'])) {
            $query->where('payment_at', '>=', $filters['payment_at_from']);
        }

        if (! empty($filters['payment_at_to'])) {
            $query->where('payment_at', '<=', $filters['payment_at_to']);
        }

        // Date range filters - opc_at
        if (! empty($filters['opc_at_from'])) {
            $query->where('opc_at', '>=', $filters['opc_at_from']);
        }

        if (! empty($filters['opc_at_to'])) {
            $query->where('opc_at', '<=', $filters['opc_at_to']);
        }

        // Team and staff filters
        if (! empty($filters['team_id'])) {
            $query->where('team_id', $filters['team_id']);
        }

        if (! empty($filters['telepro_id'])) {
            $query->where('telepro_id', $filters['telepro_id']);
        }

        if (! empty($filters['sale_1_id'])) {
            $query->where('sale_1_id', $filters['sale_1_id']);
        }

        if (! empty($filters['sale_2_id'])) {
            $query->where('sale_2_id', $filters['sale_2_id']);
        }

        if (! empty($filters['manager_id'])) {
            $query->where('manager_id', $filters['manager_id']);
        }

        if (! empty($filters['assistant_id'])) {
            $query->where('assistant_id', $filters['assistant_id']);
        }

        if (! empty($filters['installer_user_id'])) {
            $query->where('installer_user_id', $filters['installer_user_id']);
        }

        // Financial partner
        if (! empty($filters['financial_partner_id'])) {
            $query->where('financial_partner_id', $filters['financial_partner_id']);
        }

        // Price range filters
        if (! empty($filters['price_min'])) {
            $query->where('total_price_with_taxe', '>=', $filters['price_min']);
        }

        if (! empty($filters['price_max'])) {
            $query->where('total_price_with_taxe', '<=', $filters['price_max']);
        }

        // Search in remarks
        if (! empty($filters['remarks'])) {
            $query->where('remarks', 'like', '%'.$filters['remarks'].'%');
        }
    }

    /**
     * Find contract by ID
     *
     * @param int $id
     * @return CustomerContract|null
     */
    public function find(int $id): ?CustomerContract
    {
        return CustomerContract::find($id);
    }

    /**
     * Find contract with all relations
     *
     * @param int $id
     * @return CustomerContract|null
     */
    public function findWithRelations(int $id): ?CustomerContract
    {
        return CustomerContract::with([
            'customer',
            'status',
            'installStatus',
            'adminStatus',
            'products.product',
            'history',
            'contributors.user',
        ])->find($id);
    }

    /**
     * Create a new contract
     *
     * @param array $data
     * @return CustomerContract
     */
    public function create(array $data): CustomerContract
    {
        return CustomerContract::create($data);
    }

    /**
     * Update a contract
     *
     * @param CustomerContract $contract
     * @param array $data
     * @return CustomerContract
     */
    public function update(CustomerContract $contract, array $data): CustomerContract
    {
        $contract->update($data);
        $contract->refresh();

        return $contract;
    }

    /**
     * Soft delete a contract (mark as DELETE)
     *
     * @param CustomerContract $contract
     * @return bool
     */
    public function softDelete(CustomerContract $contract): bool
    {
        return $contract->update(['status' => 'DELETE']);
    }

    /**
     * Log contract history
     *
     * @param CustomerContract $contract
     * @param string $message
     * @param $user
     * @return CustomerContractHistory
     */
    public function logHistory(CustomerContract $contract, string $message, $user): CustomerContractHistory
    {
        return CustomerContractHistory::create([
            'contract_id' => $contract->id,
            'user_id' => $user->id,
            'user_application' => 'admin', // or detect from context
            'history' => $message,
        ]);
    }

    /**
     * Get contract history
     *
     * @param int $contractId
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getHistory(int $contractId)
    {
        return CustomerContractHistory::where('contract_id', $contractId)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get contract statistics
     *
     * @return array
     */
    public function getStatistics(): array
    {
        return [
            'total_contracts' => CustomerContract::active()->count(),
            'total_signed' => CustomerContract::active()->signed()->count(),
            'total_unsigned' => CustomerContract::active()->signed(false)->count(),
            'total_revenue' => CustomerContract::active()->sum('total_price_with_taxe'),
            'by_status' => CustomerContract::active()
                ->select('state_id', DB::raw('count(*) as count'))
                ->groupBy('state_id')
                ->with('status')
                ->get(),
            'by_install_status' => CustomerContract::active()
                ->select('install_state_id', DB::raw('count(*) as count'))
                ->whereNotNull('install_state_id')
                ->groupBy('install_state_id')
                ->with('installStatus')
                ->get(),
            'recent_contracts' => CustomerContract::active()
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get(),
        ];
    }

    /**
     * Generate next contract reference
     *
     * @param string $prefix
     * @return string
     */
    public function generateReference(string $prefix = 'CONT'): string
    {
        $lastContract = CustomerContract::orderBy('id', 'desc')->first();
        $nextId = $lastContract ? $lastContract->id + 1 : 1;

        return sprintf('%s-%s-%05d', $prefix, date('Y'), $nextId);
    }
}
