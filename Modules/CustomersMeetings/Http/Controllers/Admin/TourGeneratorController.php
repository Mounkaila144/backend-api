<?php

namespace Modules\CustomersMeetings\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\CustomersMeetings\Entities\TourGenerator;
use Modules\CustomersMeetings\Http\Requests\GenerateTourRequest;
use Modules\CustomersMeetings\Http\Requests\AssignSalespersonRequest;
use Modules\CustomersMeetings\Services\TourGeneratorService;
use Modules\CustomersMeetings\Services\MeetingSettingsService;

class TourGeneratorController extends Controller
{
    public function __construct(
        protected TourGeneratorService $tourService,
        protected MeetingSettingsService $settings
    ) {}

    /**
     * POST /api/admin/customersmeetings/tours/generate
     */
    public function generate(GenerateTourRequest $request): JsonResponse
    {
        $data = $request->validated();

        $result = $this->tourService->generateTour(
            $data['date'],
            $data['number_of_salespeople'],
            $data['states'] ?? []
        );

        if (!$result['success']) {
            $errorMessage = $result['message'] ?? __('Tour generation failed');
            $errorMessages = $result['messages'] ?? [['type' => 'error', 'text' => $errorMessage]];

            return response()->json([
                'success' => false,
                'message' => $errorMessage,
                'data' => ['messages' => $errorMessages],
            ], 422);
        }

        $tour = $result['tour'];
        $groupsData = [];

        foreach ($result['groups'] as $groupData) {
            // $groupData is ['group' => TourGeneratorGroup, 'meetings' => [...], ...]
            $groupModel = $groupData['group'];

            $assignments = $groupModel->assignments()->orderBy('order_in_group')->with([
                'meeting.customer.addresses' => fn ($q) => $q->where('status', 'ACTIVE'),
            ])->get();

            $meetings = $assignments->map(function ($assignment) {
                $meeting = $assignment->meeting;
                $customer = $meeting?->customer;
                $address = $customer?->addresses?->first();

                return [
                    'id' => $meeting->id,
                    'order_in_group' => $assignment->order_in_group,
                    'customer_name' => $customer
                        ? mb_strtoupper(trim($customer->lastname . ' ' . $customer->firstname))
                        : 'Meeting #' . $meeting->id,
                    'address' => $address ? trim($address->address1 . ', ' . $address->postcode . ' ' . $address->city) : '',
                    'postcode' => $address->postcode ?? '',
                    'city' => $address->city ?? '',
                    'in_at' => $meeting->in_at,
                    'lat' => $address ? (float) $address->lat : null,
                    'lng' => $address ? (float) $address->lng : null,
                ];
            });

            $groupsData[] = [
                'id' => $groupModel->id,
                'sale_id' => $groupModel->sale_id,
                'salesperson' => $groupModel->salesperson ? [
                    'id' => $groupModel->salesperson->id,
                    'name' => mb_strtoupper(trim($groupModel->salesperson->lastname . ' ' . $groupModel->salesperson->firstname)),
                ] : null,
                'total_distance' => (float) $groupModel->total_distance,
                'total_duration' => (int) $groupModel->total_duration,
                'meetings' => $meetings,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'tour' => [
                    'id' => $tour->id,
                    'date' => $tour->date->toDateString(),
                    'status' => $tour->status,
                    'created_at' => $tour->created_at?->toISOString(),
                ],
                'groups' => $groupsData,
                'messages' => $result['messages'],
            ],
        ]);
    }

    /**
     * GET /api/admin/customersmeetings/tours/{id}
     */
    public function show(int $id): JsonResponse
    {
        $tour = TourGenerator::find($id);

        if (!$tour) {
            return response()->json(['success' => false, 'message' => __('Tour not found')], 404);
        }

        $groupsWithMeetings = $tour->getGroupsWithMeetings();

        $groupsData = $groupsWithMeetings->map(function ($group) {
            $meetings = $group->assignments->map(function ($assignment) {
                $meeting = $assignment->meeting;
                $customer = $meeting->customer;
                $address = $customer?->addresses?->first();

                return [
                    'id' => $meeting->id,
                    'order_in_group' => $assignment->order_in_group,
                    'customer_name' => $customer
                        ? mb_strtoupper(trim($customer->lastname . ' ' . $customer->firstname))
                        : 'Meeting #' . $meeting->id,
                    'address' => $address ? trim($address->address1 . ', ' . $address->postcode . ' ' . $address->city) : '',
                    'postcode' => $address->postcode ?? '',
                    'city' => $address->city ?? '',
                    'in_at' => $meeting->in_at,
                    'lat' => $address ? (float) $address->lat : null,
                    'lng' => $address ? (float) $address->lng : null,
                ];
            });

            return [
                'id' => $group->id,
                'sale_id' => $group->sale_id,
                'salesperson' => $group->salesperson ? [
                    'id' => $group->salesperson->id,
                    'name' => mb_strtoupper(trim($group->salesperson->lastname . ' ' . $group->salesperson->firstname)),
                ] : null,
                'total_distance' => (float) $group->total_distance,
                'total_duration' => (int) $group->total_duration,
                'meetings' => $meetings,
            ];
        });

        // Available salespeople for assignment
        $salespeople = \Modules\UsersGuard\Entities\User::select('id', 'firstname', 'lastname')
            ->where('is_active', 'YES')
            ->orderBy('lastname')
            ->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => mb_strtoupper(trim($u->lastname . ' ' . $u->firstname)),
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'tour' => [
                    'id' => $tour->id,
                    'date' => $tour->date->toDateString(),
                    'status' => $tour->status,
                    'created_at' => $tour->created_at?->toISOString(),
                ],
                'groups' => $groupsData,
                'available_salespeople' => $salespeople,
            ],
        ]);
    }

    /**
     * POST /api/admin/customersmeetings/tours/{tourId}/groups/{groupId}/assign
     */
    public function assignSalesperson(AssignSalespersonRequest $request, int $tourId, int $groupId): JsonResponse
    {
        $tour = TourGenerator::find($tourId);

        if (!$tour) {
            return response()->json(['success' => false, 'message' => __('Tour not found')], 404);
        }

        $result = $this->tourService->assignSalespersonToGroup(
            $groupId,
            $request->validated()['salesperson_id']
        );

        return response()->json($result, $result['success'] ? 200 : 422);
    }

    /**
     * DELETE /api/admin/customersmeetings/tours/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $tour = TourGenerator::find($id);

        if (!$tour) {
            return response()->json(['success' => false, 'message' => __('Tour not found')], 404);
        }

        // Clear meeting assignments before deleting
        foreach ($tour->assignments as $assignment) {
            $meeting = $assignment->meeting;
            if ($meeting) {
                $meeting->update(['sales_id' => 0]);
            }
        }

        $tour->delete(); // cascade deletes groups, assignments, matrix

        return response()->json(['success' => true, 'message' => __('Tour deleted successfully')]);
    }

    /**
     * GET /api/admin/customersmeetings/tours/by-range?start=...&end=...
     * Returns lightweight list of existing tours for a date range (for calendar indicators).
     */
    public function byRange(Request $request): JsonResponse
    {
        $start = $request->query('start', now()->startOfWeek()->toDateString());
        $end = $request->query('end', now()->endOfWeek()->toDateString());

        $tours = TourGenerator::whereBetween('date', [$start, $end])
            ->select('id', 'date', 'status')
            ->withCount('groups')
            ->withCount('assignments')
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'date' => $t->date->toDateString(),
                'status' => $t->status,
                'groups_count' => $t->groups_count,
                'meetings_count' => $t->assignments_count,
            ]);

        return response()->json(['success' => true, 'data' => $tours]);
    }

    /**
     * GET /api/admin/customersmeetings/tours/settings
     */
    public function settings(): JsonResponse
    {
        $tourSettings = [];
        $defaults = [
            'tour_average_meeting_duration', 'tour_average_speed_kmh',
            'tour_max_total_distance_limit', 'tour_dbscan_max_eps_km',
            'tour_max_duration_hours', 'tour_max_duration_minutes',
            'tour_openroute_server_url', 'tour_openroute_timeout',
            'tour_openroute_api_key', 'tour_data_gouv_endpoint',
            'tour_data_gouv_timeout', 'tour_mapbox_access_token',
        ];

        foreach ($defaults as $key) {
            $tourSettings[$key] = $this->settings->get($key);
        }

        return response()->json(['success' => true, 'data' => $tourSettings]);
    }

    /**
     * PUT /api/admin/customersmeetings/tours/settings
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tour_average_meeting_duration' => 'nullable|integer|min:5|max:240',
            'tour_average_speed_kmh' => 'nullable|integer|min:10|max:130',
            'tour_max_total_distance_limit' => 'nullable|integer|min:10|max:1000',
            'tour_dbscan_max_eps_km' => 'nullable|integer|min:1|max:100',
            'tour_max_duration_hours' => 'nullable|integer|min:1|max:24',
            'tour_max_duration_minutes' => 'nullable|integer|min:0|max:59',
            'tour_openroute_server_url' => 'nullable|string|max:255',
            'tour_openroute_timeout' => 'nullable|integer|min:1|max:60',
            'tour_openroute_api_key' => 'nullable|string|max:255',
            'tour_data_gouv_endpoint' => 'nullable|string|max:255',
            'tour_data_gouv_timeout' => 'nullable|integer|min:1|max:30',
            'tour_mapbox_access_token' => 'nullable|string|max:255',
        ]);

        $toSave = array_filter($validated, fn ($v) => $v !== null);

        $this->settings->save($toSave);

        return response()->json(['success' => true, 'message' => __('Settings updated')]);
    }
}
