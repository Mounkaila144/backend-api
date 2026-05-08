<?php

namespace Modules\CustomersContracts\Services;

use Illuminate\Support\Facades\DB;
use Modules\AppDomoprime\Entities\DomoprimeQuotation;
use Modules\CustomersContracts\Entities\CustomerContract;
use Modules\CustomersMeetings\Entities\CustomerMeeting;
use RuntimeException;

/**
 * Story M4 — turn a meeting into a full contract and migrate every
 * meeting-attached quotation onto the new contract.
 *
 * Mirror of Symfony CustomerContract::createFromMeeting() +
 * DomoprimeQuotationMigration::migrateQuotationsFromMeetingToContract.
 *
 * The whole flow runs inside a single tenant DB transaction with a row-level
 * lock on the meeting so two concurrent transform requests cannot both
 * create a contract.
 */
class MeetingToContractMigrationService
{
    public function __construct(private readonly ContractSettingsService $contractSettings = new ContractSettingsService())
    {
    }

    /**
     * @return array{contract: CustomerContract, quotations_migrated: int, already_existed: bool}
     */
    public function transform(CustomerMeeting $meeting, ?int $userId = null): array
    {
        if (! $meeting->customer_id) {
            throw new RuntimeException('Meeting has no customer; cannot transform to contract');
        }
        if (! $meeting->polluter_id) {
            throw new RuntimeException('Meeting has no polluter; cannot transform to contract');
        }

        return DB::connection('tenant')->transaction(function () use ($meeting, $userId) {
            // Lock the meeting row so a concurrent transform request blocks
            // until we either create or surface the existing contract.
            $locked = CustomerMeeting::query()
                ->where('id', $meeting->id)
                ->lockForUpdate()
                ->first();

            if (! $locked) {
                throw new RuntimeException('Meeting disappeared during transform');
            }

            $existing = CustomerContract::query()
                ->where('meeting_id', $locked->id)
                ->lockForUpdate()
                ->first();

            if ($existing) {
                // Migration is idempotent — make sure quotations attached only to
                // the meeting also point to the contract.
                $migrated = $this->migrateQuotations($locked, $existing);
                return [
                    'contract' => $existing,
                    'quotations_migrated' => $migrated,
                    'already_existed' => true,
                ];
            }

            $contract = $this->createContract($locked, $userId);
            $migrated = $this->migrateQuotations($locked, $contract);

            return [
                'contract' => $contract,
                'quotations_migrated' => $migrated,
                'already_existed' => false,
            ];
        });
    }

    private function createContract(CustomerMeeting $meeting, ?int $userId): CustomerContract
    {
        $contract = new CustomerContract();
        $contract->customer_id = (int) $meeting->customer_id;
        $contract->meeting_id = (int) $meeting->id;
        $contract->polluter_id = $meeting->polluter_id ? (int) $meeting->polluter_id : null;
        $contract->company_id = $meeting->company_id ? (int) $meeting->company_id : null;
        $contract->partner_layer_id = $meeting->partner_layer_id ? (int) $meeting->partner_layer_id : null;
        $contract->campaign_id = $meeting->campaign_id ? (int) $meeting->campaign_id : null;
        $contract->team_id = 0;
        $contract->telepro_id = (int) ($meeting->telepro_id ?? 0);
        $contract->sale_1_id = (int) ($meeting->sales_id ?? 0);
        $contract->sale_2_id = (int) ($meeting->sale2_id ?? 0);
        $contract->assistant_id = (int) ($meeting->assistant_id ?? 0);
        $contract->created_by_id = $userId ?? ($meeting->created_by_id ? (int) $meeting->created_by_id : null);
        $contract->opened_at = now()->toDateString();
        $contract->is_billable = 'YES';
        $contract->is_signed = 'NO';
        $contract->is_confirmed = 'NO';
        $contract->is_hold = 'NO';
        $contract->is_hold_quote = 'NO';
        $contract->is_hold_admin = 'NO';
        $contract->is_document = 'NO';
        $contract->is_photo = 'NO';
        $contract->is_quality = 'NO';
        $contract->status = 'ACTIVE';
        $contract->save();

        // Reference uses contract id (CT-{id}) when no other generator is wired.
        $contract->reference = 'CT-'.$contract->id;
        $contract->save();

        return $contract;
    }

    /**
     * Move all quotations currently attached to the meeting onto the contract
     * (without removing the meeting_id link). Returns the count of rows
     * actually updated.
     */
    private function migrateQuotations(CustomerMeeting $meeting, CustomerContract $contract): int
    {
        $rows = DomoprimeQuotation::query()
            ->where('meeting_id', $meeting->id)
            ->where(function ($q) use ($contract) {
                $q->whereNull('contract_id')->orWhere('contract_id', '!=', $contract->id);
            })
            ->update(['contract_id' => $contract->id]);

        // Resolve is_last conflicts: keep at most one is_last='YES' for the
        // contract scope (most recent wins). The meeting scope is unchanged.
        $lastIds = DomoprimeQuotation::query()
            ->where('contract_id', $contract->id)
            ->where('is_last', 'YES')
            ->orderByDesc('id')
            ->pluck('id');

        if ($lastIds->count() > 1) {
            $keep = $lastIds->first();
            DomoprimeQuotation::query()
                ->where('contract_id', $contract->id)
                ->where('is_last', 'YES')
                ->where('id', '!=', $keep)
                ->update(['is_last' => 'NO']);
        }

        return (int) $rows;
    }
}
