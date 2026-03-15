<?php

namespace Modules\CustomersMeetings\Http\Controllers\Frontend;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\CustomersMeetings\Entities\CustomerMeeting;

class IndexController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $meetings = CustomerMeeting::active()
            ->with(['customer', 'meetingStatus'])
            ->orderBy('in_at', 'desc')
            ->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $meetings,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $meeting = CustomerMeeting::with(['customer', 'meetingStatus'])->find($id);

        if (! $meeting) {
            return response()->json(['success' => false, 'message' => 'Meeting not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $meeting]);
    }
}
