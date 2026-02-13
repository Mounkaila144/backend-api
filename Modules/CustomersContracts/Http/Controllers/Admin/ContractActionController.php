<?php

namespace Modules\CustomersContracts\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Modules\CustomersContracts\Entities\CustomerContract;
use Modules\CustomersContracts\Repositories\ContractRepository;
use Modules\CustomersContracts\Services\ContractSettingsService;

class ContractActionController extends Controller
{
    public function __construct(
        protected ContractRepository $repository,
        protected ContractSettingsService $settings
    ) {
    }

    // ─── Confirm / Unconfirm ─────────────────────────────────

    public function confirm(int $id, Request $request): JsonResponse
    {
        $contract = $this->findOrFail($id);

        DB::connection('tenant')->beginTransaction();
        $contract->setConfirmed($this->settings);
        $this->repository->logHistory($contract, 'Contract confirmed', $request->user());
        DB::connection('tenant')->commit();

        return $this->actionResponse('ConfirmContract', $contract);
    }

    public function unconfirm(int $id, Request $request): JsonResponse
    {
        $contract = $this->findOrFail($id);

        DB::connection('tenant')->beginTransaction();
        $contract->setUnconfirmed($this->settings);
        $this->repository->logHistory($contract, 'Contract unconfirmed', $request->user());
        DB::connection('tenant')->commit();

        return $this->actionResponse('UnconfirmContract', $contract);
    }

    // ─── Cancel / Uncancel ───────────────────────────────────

    public function cancel(int $id, Request $request): JsonResponse
    {
        $contract = $this->findOrFail($id);

        if ($contract->isHold()) {
            return response()->json(['success' => false, 'message' => 'Cannot cancel a contract on hold'], 422);
        }

        DB::connection('tenant')->beginTransaction();
        $contract->setCancelled($this->settings);
        $this->repository->logHistory($contract, 'Contract cancelled', $request->user());
        DB::connection('tenant')->commit();

        return $this->actionResponse('CancelContract', $contract);
    }

    public function uncancel(int $id, Request $request): JsonResponse
    {
        $contract = $this->findOrFail($id);

        DB::connection('tenant')->beginTransaction();
        $contract->setUncancelled($this->settings);
        $this->repository->logHistory($contract, 'Contract uncancelled', $request->user());
        DB::connection('tenant')->commit();

        return $this->actionResponse('UncancelContract', $contract);
    }

    // ─── Blowing / Unblowing ─────────────────────────────────

    public function blowing(int $id, Request $request): JsonResponse
    {
        $contract = $this->findOrFail($id);

        if ($contract->isHold()) {
            return response()->json(['success' => false, 'message' => 'Cannot set blowing on a contract on hold'], 422);
        }

        DB::connection('tenant')->beginTransaction();
        $contract->setBlowing($this->settings);
        $this->repository->logHistory($contract, 'Contract set to blowing', $request->user());
        DB::connection('tenant')->commit();

        return $this->actionResponse('BlowingContract', $contract);
    }

    public function unblowing(int $id, Request $request): JsonResponse
    {
        $contract = $this->findOrFail($id);

        DB::connection('tenant')->beginTransaction();
        $contract->setUnblowing($this->settings);
        $this->repository->logHistory($contract, 'Contract blowing removed', $request->user());
        DB::connection('tenant')->commit();

        return $this->actionResponse('UnblowingContract', $contract);
    }

    // ─── Placement / Unplacement ─────────────────────────────

    public function placement(int $id, Request $request): JsonResponse
    {
        $contract = $this->findOrFail($id);

        if ($contract->isHold()) {
            return response()->json(['success' => false, 'message' => 'Cannot set placement on a contract on hold'], 422);
        }

        DB::connection('tenant')->beginTransaction();
        $contract->setPlacement($this->settings);
        $this->repository->logHistory($contract, 'Contract set to placement', $request->user());
        DB::connection('tenant')->commit();

        return $this->actionResponse('PlacementContract', $contract);
    }

    public function unplacement(int $id, Request $request): JsonResponse
    {
        $contract = $this->findOrFail($id);

        DB::connection('tenant')->beginTransaction();
        $contract->setUnplacement($this->settings);
        $this->repository->logHistory($contract, 'Contract placement removed', $request->user());
        DB::connection('tenant')->commit();

        return $this->actionResponse('UnplacementContract', $contract);
    }

    // ─── Hold toggles ────────────────────────────────────────

    public function hold(int $id, Request $request): JsonResponse
    {
        $contract = $this->findOrFail($id);

        DB::connection('tenant')->beginTransaction();
        $contract->setHold();
        $this->repository->logHistory($contract, 'Contract put on hold', $request->user());
        DB::connection('tenant')->commit();

        return $this->actionResponse('HoldContract', $contract);
    }

    public function unhold(int $id, Request $request): JsonResponse
    {
        $contract = $this->findOrFail($id);

        DB::connection('tenant')->beginTransaction();
        $contract->setUnhold();
        $this->repository->logHistory($contract, 'Contract hold removed', $request->user());
        DB::connection('tenant')->commit();

        return $this->actionResponse('UnholdContract', $contract);
    }

    public function holdAdmin(int $id, Request $request): JsonResponse
    {
        $contract = $this->findOrFail($id);

        DB::connection('tenant')->beginTransaction();
        $contract->setHoldAdmin();
        $this->repository->logHistory($contract, 'Contract admin hold set', $request->user());
        DB::connection('tenant')->commit();

        return $this->actionResponse('HoldAdminContract', $contract);
    }

    public function unholdAdmin(int $id, Request $request): JsonResponse
    {
        $contract = $this->findOrFail($id);

        DB::connection('tenant')->beginTransaction();
        $contract->setUnholdAdmin();
        $this->repository->logHistory($contract, 'Contract admin hold removed', $request->user());
        DB::connection('tenant')->commit();

        return $this->actionResponse('UnholdAdminContract', $contract);
    }

    public function holdQuote(int $id, Request $request): JsonResponse
    {
        $contract = $this->findOrFail($id);

        DB::connection('tenant')->beginTransaction();
        $contract->setHoldQuote();
        $this->repository->logHistory($contract, 'Contract quote hold set', $request->user());
        DB::connection('tenant')->commit();

        return $this->actionResponse('HoldQuoteContract', $contract);
    }

    public function unholdQuote(int $id, Request $request): JsonResponse
    {
        $contract = $this->findOrFail($id);

        DB::connection('tenant')->beginTransaction();
        $contract->setUnholdQuote();
        $this->repository->logHistory($contract, 'Contract quote hold removed', $request->user());
        DB::connection('tenant')->commit();

        return $this->actionResponse('UnholdQuoteContract', $contract);
    }

    // ─── Copy ────────────────────────────────────────────────

    public function copy(int $id, Request $request): JsonResponse
    {
        $contract = $this->findOrFail($id);

        DB::connection('tenant')->beginTransaction();
        $newContract = $contract->copy();
        $this->repository->logHistory($newContract, 'Contract copied from #' . $contract->id, $request->user());
        DB::connection('tenant')->commit();

        return response()->json([
            'success' => true,
            'action' => 'CopyContract',
            'id' => $newContract->id,
            'message' => 'Contract copied successfully',
        ], 201);
    }

    // ─── Create default products ─────────────────────────────

    public function createDefaultProducts(int $id, Request $request): JsonResponse
    {
        $contract = $this->findOrFail($id);

        if ($contract->isHold()) {
            return response()->json(['success' => false, 'message' => 'Cannot create products on a contract on hold'], 422);
        }

        DB::connection('tenant')->beginTransaction();
        // Default products logic: delegate to repository or config
        $this->repository->logHistory($contract, 'Default products created', $request->user());
        DB::connection('tenant')->commit();

        return $this->actionResponse('CreateDefaultProducts', $contract);
    }

    // ─── Recycle ─────────────────────────────────────────────

    public function recycle(int $id, Request $request): JsonResponse
    {
        $contract = $this->findOrFail($id);

        DB::connection('tenant')->beginTransaction();
        $contract->update(['status' => 'ACTIVE']);
        $this->repository->logHistory($contract, 'Contract recycled (set back to ACTIVE)', $request->user());
        DB::connection('tenant')->commit();

        return $this->actionResponse('RecycleContract', $contract);
    }

    // ─── Toggle field (is_document, is_photo, is_quality) ────

    public function toggleField(int $id, Request $request): JsonResponse
    {
        $field = $request->input('field');
        $allowedFields = ['is_document', 'is_photo', 'is_quality'];

        if (! in_array($field, $allowedFields, true)) {
            return response()->json(['success' => false, 'message' => 'Invalid field: ' . $field], 422);
        }

        $contract = $this->findOrFail($id);

        $currentValue = $contract->{$field};
        $newValue = ($currentValue === 'Y' || $currentValue === 'YES') ? 'N' : 'Y';
        $contract->update([$field => $newValue]);

        $this->repository->logHistory(
            $contract,
            "Field {$field} toggled to {$newValue}",
            $request->user()
        );

        return $this->actionResponse('ToggleField', $contract);
    }

    // ─── SMS / Email (validation + client info) ──────────────

    public function sendSms(int $id, Request $request): JsonResponse
    {
        $contract = $this->findOrFail($id);
        $contract->load('customer');

        $mobile = $contract->customer->mobile ?? $contract->customer->phone ?? null;

        if (! $mobile) {
            return response()->json(['success' => false, 'message' => 'Customer has no phone number'], 422);
        }

        $message = $request->input('message');

        if (! $message) {
            return response()->json(['success' => false, 'message' => 'Message is required'], 422);
        }

        // TODO: integrate with SMS provider service
        $this->repository->logHistory($contract, 'SMS sent to ' . $mobile, $request->user());

        return response()->json([
            'success' => true,
            'action' => 'SendSms',
            'id' => $contract->id,
            'message' => 'SMS sent successfully',
        ]);
    }

    public function sendEmail(int $id, Request $request): JsonResponse
    {
        $contract = $this->findOrFail($id);
        $contract->load('customer');

        $email = $contract->customer->email ?? null;

        if (! $email) {
            return response()->json(['success' => false, 'message' => 'Customer has no email address'], 422);
        }

        $subject = $request->input('subject');
        $body = $request->input('body');

        if (! $subject || ! $body) {
            return response()->json(['success' => false, 'message' => 'Subject and body are required'], 422);
        }

        // TODO: integrate with email service
        $this->repository->logHistory($contract, 'Email sent to ' . $email, $request->user());

        return response()->json([
            'success' => true,
            'action' => 'SendEmail',
            'id' => $contract->id,
            'message' => 'Email sent successfully',
        ]);
    }

    // ─── Comments ────────────────────────────────────────────

    public function addComment(int $id, Request $request): JsonResponse
    {
        $contract = $this->findOrFail($id);

        $comment = $request->input('comment');

        if (! $comment) {
            return response()->json(['success' => false, 'message' => 'Comment is required'], 422);
        }

        $this->repository->logHistory($contract, 'Comment: ' . $comment, $request->user());

        return response()->json([
            'success' => true,
            'action' => 'AddComment',
            'id' => $contract->id,
            'message' => 'Comment added successfully',
        ]);
    }

    // ─── Helpers ─────────────────────────────────────────────

    protected function findOrFail(int $id): CustomerContract
    {
        $contract = CustomerContract::find($id);

        if (! $contract) {
            abort(404, 'Contract not found');
        }

        return $contract;
    }

    protected function actionResponse(string $action, CustomerContract $contract): JsonResponse
    {
        $contract->load('contractStatus');

        $state = null;
        $stateI18n = null;

        if ($contract->contractStatus) {
            $state = [
                'icon' => $contract->contractStatus->icon ?? '',
                'color' => $contract->contractStatus->color ?? '#666',
            ];
            $stateI18n = $contract->contractStatus->value ?? $contract->contractStatus->name ?? '';
        }

        return response()->json([
            'success' => true,
            'action' => $action,
            'id' => $contract->id,
            'state' => $state,
            'state_i18n' => $stateI18n,
            'message' => $action . ' completed successfully',
        ]);
    }
}
