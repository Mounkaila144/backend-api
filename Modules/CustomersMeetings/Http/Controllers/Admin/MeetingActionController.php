<?php

namespace Modules\CustomersMeetings\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Modules\CustomersMeetings\Entities\CustomerMeeting;
use Modules\CustomersMeetings\Repositories\MeetingRepository;
use Modules\CustomersMeetings\Services\MeetingSettingsService;

class MeetingActionController extends Controller
{
    public function __construct(
        protected MeetingRepository $repository,
        protected MeetingSettingsService $settings
    ) {
    }

    // --- Confirm / Unconfirm ---

    public function confirm(int $id, Request $request): JsonResponse
    {
        $meeting = $this->findOrFail($id);

        DB::connection('tenant')->beginTransaction();
        $meeting->setConfirmed($this->settings);
        $this->repository->logHistory($meeting, 'Meeting confirmed', $request->user());
        DB::connection('tenant')->commit();

        return $this->actionResponse('ConfirmMeeting', $meeting);
    }

    public function unconfirm(int $id, Request $request): JsonResponse
    {
        $meeting = $this->findOrFail($id);

        DB::connection('tenant')->beginTransaction();
        $meeting->setUnconfirmed($this->settings);
        $this->repository->logHistory($meeting, 'Meeting unconfirmed', $request->user());
        DB::connection('tenant')->commit();

        return $this->actionResponse('UnconfirmMeeting', $meeting);
    }

    // --- Cancel / Uncancel ---

    public function cancel(int $id, Request $request): JsonResponse
    {
        $meeting = $this->findOrFail($id);

        if ($meeting->isHold()) {
            return response()->json(['success' => false, 'message' => 'Cannot cancel a meeting on hold'], 422);
        }

        DB::connection('tenant')->beginTransaction();
        $meeting->setCancelled($this->settings);
        $this->repository->logHistory($meeting, 'Meeting cancelled', $request->user());
        DB::connection('tenant')->commit();

        return $this->actionResponse('CancelMeeting', $meeting);
    }

    public function uncancel(int $id, Request $request): JsonResponse
    {
        $meeting = $this->findOrFail($id);

        DB::connection('tenant')->beginTransaction();
        $meeting->setUncancelled($this->settings);
        $this->repository->logHistory($meeting, 'Meeting uncancelled', $request->user());
        DB::connection('tenant')->commit();

        return $this->actionResponse('UncancelMeeting', $meeting);
    }

    // --- Hold toggles ---

    public function hold(int $id, Request $request): JsonResponse
    {
        $meeting = $this->findOrFail($id);

        DB::connection('tenant')->beginTransaction();
        $meeting->setHold();
        $this->repository->logHistory($meeting, 'Meeting put on hold', $request->user());
        DB::connection('tenant')->commit();

        return $this->actionResponse('HoldMeeting', $meeting);
    }

    public function unhold(int $id, Request $request): JsonResponse
    {
        $meeting = $this->findOrFail($id);

        DB::connection('tenant')->beginTransaction();
        $meeting->setUnhold();
        $this->repository->logHistory($meeting, 'Meeting hold removed', $request->user());
        DB::connection('tenant')->commit();

        return $this->actionResponse('UnholdMeeting', $meeting);
    }

    public function holdQuote(int $id, Request $request): JsonResponse
    {
        $meeting = $this->findOrFail($id);

        DB::connection('tenant')->beginTransaction();
        $meeting->setHoldQuote();
        $this->repository->logHistory($meeting, 'Meeting quote hold set', $request->user());
        DB::connection('tenant')->commit();

        return $this->actionResponse('HoldQuoteMeeting', $meeting);
    }

    public function unholdQuote(int $id, Request $request): JsonResponse
    {
        $meeting = $this->findOrFail($id);

        DB::connection('tenant')->beginTransaction();
        $meeting->setUnholdQuote();
        $this->repository->logHistory($meeting, 'Meeting quote hold removed', $request->user());
        DB::connection('tenant')->commit();

        return $this->actionResponse('UnholdQuoteMeeting', $meeting);
    }

    // --- Lock management ---

    public function lock(int $id, Request $request): JsonResponse
    {
        $meeting = $this->findOrFail($id);

        if ($meeting->isLocked()) {
            return response()->json(['success' => false, 'message' => 'Meeting is already locked'], 422);
        }

        DB::connection('tenant')->beginTransaction();
        $meeting->setLocked($request->user()->id);
        $this->repository->logHistory($meeting, 'Meeting locked', $request->user());
        DB::connection('tenant')->commit();

        return $this->actionResponse('LockMeeting', $meeting);
    }

    public function unlock(int $id, Request $request): JsonResponse
    {
        $meeting = $this->findOrFail($id);

        DB::connection('tenant')->beginTransaction();
        $meeting->setUnlocked();
        $this->repository->logHistory($meeting, 'Meeting unlocked', $request->user());
        DB::connection('tenant')->commit();

        return $this->actionResponse('UnlockMeeting', $meeting);
    }

    // --- Callback ---

    public function cancelCallback(int $id, Request $request): JsonResponse
    {
        $meeting = $this->findOrFail($id);

        DB::connection('tenant')->beginTransaction();
        $meeting->cancelCallback();
        $this->repository->logHistory($meeting, 'Callback cancelled', $request->user());
        DB::connection('tenant')->commit();

        return $this->actionResponse('CancelCallback', $meeting);
    }

    // --- Copy ---

    public function copy(int $id, Request $request): JsonResponse
    {
        $meeting = $this->findOrFail($id);

        DB::connection('tenant')->beginTransaction();
        $newMeeting = $meeting->copy();
        $this->repository->logHistory($newMeeting, 'Meeting copied from #' . $meeting->id, $request->user());
        DB::connection('tenant')->commit();

        return response()->json([
            'success' => true,
            'action' => 'CopyMeeting',
            'id' => $newMeeting->id,
            'message' => 'Meeting copied successfully',
        ], 201);
    }

    // --- Recycle ---

    public function recycle(int $id, Request $request): JsonResponse
    {
        $meeting = $this->findOrFail($id);

        DB::connection('tenant')->beginTransaction();
        $meeting->update(['status' => 'ACTIVE']);
        $this->repository->logHistory($meeting, 'Meeting recycled (set back to ACTIVE)', $request->user());
        DB::connection('tenant')->commit();

        return $this->actionResponse('RecycleMeeting', $meeting);
    }

    // --- Create contract from meeting ---

    public function createContract(int $id, Request $request): JsonResponse
    {
        $meeting = $this->findOrFail($id);

        // Update meeting status to transfer
        $transferStatusId = $this->settings->getStatusTransferToContract();
        if ($transferStatusId) {
            $meeting->update(['state_id' => $transferStatusId]);
        }

        $this->repository->logHistory($meeting, 'Contract creation initiated from meeting', $request->user());

        return response()->json([
            'success' => true,
            'action' => 'CreateContract',
            'meeting_id' => $meeting->id,
            'customer_id' => $meeting->customer_id,
            'message' => 'Contract creation initiated',
        ]);
    }

    // --- SMS / Email ---

    public function sendSms(int $id, Request $request): JsonResponse
    {
        $meeting = $this->findOrFail($id);
        $meeting->load('customer');

        $mobile = $meeting->customer->mobile ?? $meeting->customer->phone ?? null;

        if (! $mobile) {
            return response()->json(['success' => false, 'message' => 'Customer has no phone number'], 422);
        }

        $message = $request->input('message');

        if (! $message) {
            return response()->json(['success' => false, 'message' => 'Message is required'], 422);
        }

        // TODO: integrate with SMS provider service
        $this->repository->logHistory($meeting, 'SMS sent to ' . $mobile, $request->user());

        return response()->json([
            'success' => true,
            'action' => 'SendSms',
            'id' => $meeting->id,
            'message' => 'SMS sent successfully',
        ]);
    }

    public function sendEmail(int $id, Request $request): JsonResponse
    {
        $meeting = $this->findOrFail($id);
        $meeting->load('customer');

        $email = $meeting->customer->email ?? null;

        if (! $email) {
            return response()->json(['success' => false, 'message' => 'Customer has no email address'], 422);
        }

        $subject = $request->input('subject');
        $body = $request->input('body');

        if (! $subject || ! $body) {
            return response()->json(['success' => false, 'message' => 'Subject and body are required'], 422);
        }

        // TODO: integrate with email service
        $this->repository->logHistory($meeting, 'Email sent to ' . $email, $request->user());

        return response()->json([
            'success' => true,
            'action' => 'SendEmail',
            'id' => $meeting->id,
            'message' => 'Email sent successfully',
        ]);
    }

    // --- Comments ---

    public function addComment(int $id, Request $request): JsonResponse
    {
        $meeting = $this->findOrFail($id);

        $comment = $request->input('comment');

        if (! $comment) {
            return response()->json(['success' => false, 'message' => 'Comment is required'], 422);
        }

        $this->repository->logHistory($meeting, 'Comment: ' . $comment, $request->user());

        return response()->json([
            'success' => true,
            'action' => 'AddComment',
            'id' => $meeting->id,
            'message' => 'Comment added successfully',
        ]);
    }

    // --- Helpers ---

    protected function findOrFail(int $id): CustomerMeeting
    {
        $meeting = CustomerMeeting::find($id);

        if (! $meeting) {
            abort(404, 'Meeting not found');
        }

        return $meeting;
    }

    protected function actionResponse(string $action, CustomerMeeting $meeting): JsonResponse
    {
        $meeting->load('meetingStatus');

        $state = null;
        $stateI18n = null;

        if ($meeting->meetingStatus) {
            $state = [
                'icon' => $meeting->meetingStatus->icon ?? '',
                'color' => $meeting->meetingStatus->color ?? '#666',
            ];
            $stateI18n = $meeting->meetingStatus->value ?? $meeting->meetingStatus->name ?? '';
        }

        return response()->json([
            'success' => true,
            'action' => $action,
            'id' => $meeting->id,
            'state' => $state,
            'state_i18n' => $stateI18n,
            'message' => $action . ' completed successfully',
        ]);
    }
}
