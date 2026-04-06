<?php

namespace Modules\CustomersMeetings\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Modules\CustomersMeetings\Http\Resources\MeetingResource;
use Modules\CustomersMeetings\Http\Resources\MeetingListResource;
use Modules\CustomersMeetings\Http\Resources\MeetingListCollection;
use Modules\CustomersMeetings\Http\Requests\StoreMeetingRequest;
use Modules\CustomersMeetings\Http\Requests\UpdateMeetingRequest;
use Modules\CustomersMeetings\Repositories\MeetingRepository;

class MeetingController extends Controller
{
    public function __construct(protected MeetingRepository $repository)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $dataPermissions = MeetingListResource::resolvePermittedFields($user);
        MeetingListResource::setPermittedFields($dataPermissions);

        $visibleColumns = MeetingListResource::resolveVisibleColumns($user);

        $permittedFields = array_values(array_unique(
            array_merge(MeetingListResource::ALWAYS_VISIBLE_COLUMNS, $visibleColumns)
        ));

        $meetings = $this->repository->getFilteredMeetings(
            $request->all(),
            $request->integer('per_page', 15),
            array_keys(MeetingListResource::FIELD_PERMISSIONS)
        );

        return response()->json([
            'success' => true,
            'data' => new MeetingListCollection($meetings),
            'meta' => [
                'current_page' => $meetings->currentPage(),
                'last_page' => $meetings->lastPage(),
                'per_page' => $meetings->perPage(),
                'total' => $meetings->total(),
                'permitted_fields' => $permittedFields,
            ],
        ]);
    }

    public function store(StoreMeetingRequest $request): JsonResponse
    {
        $data = $request->validated();

        DB::beginTransaction();

        $data = $this->resolveCustomerData($data);

        $data['status'] = $data['status'] ?? 'ACTIVE';
        if (empty($data['creation_at'])) {
            $data['creation_at'] = now();
        }

        $meeting = $this->repository->create($data);

        // Save products
        if (! empty($request->products)) {
            foreach ($request->products as $product) {
                $meeting->products()->create([
                    'product_id' => $product['product_id'],
                    'details' => $product['details'] ?? '',
                ]);
            }
        }

        $this->repository->logHistory($meeting, 'Meeting created', $request->user());

        DB::commit();

        return response()->json([
            'success' => true,
            'message' => 'Meeting created successfully',
            'data' => new MeetingResource($this->repository->findWithRelations($meeting->id)),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $meeting = $this->repository->findWithRelations($id);

        if (! $meeting) {
            return response()->json(['success' => false, 'message' => 'Meeting not found'], 404);
        }

        return response()->json(['success' => true, 'data' => new MeetingResource($meeting)]);
    }

    public function update(UpdateMeetingRequest $request, int $id): JsonResponse
    {
        $meeting = $this->repository->find($id);

        if (! $meeting) {
            return response()->json(['success' => false, 'message' => 'Meeting not found'], 404);
        }

        $data = $request->validated();

        DB::beginTransaction();

        $data = $this->resolveCustomerData($data, $meeting->customer_id);

        $oldData = $meeting->toArray();
        $meeting = $this->repository->update($meeting, $data);

        // Update Domoprime Request if provided
        if ($request->has('domoprime_request') && is_array($request->input('domoprime_request'))) {
            $domoprimeData = $request->input('domoprime_request');
            $domoprimeFields = [
                'revenue', 'number_of_people', 'number_of_children', 'number_of_fiscal',
                'number_of_parts', 'declarants', 'surface_home', 'surface_wall',
                'surface_top', 'surface_floor', 'surface_ite', 'parcel_surface',
                'parcel_reference', 'more_2_years', 'build_year',
                'energy_id', 'previous_energy_id', 'occupation_id', 'layer_type_id', 'pricing_id',
            ];
            $filtered = array_intersect_key($domoprimeData, array_flip($domoprimeFields));

            if (!empty($filtered)) {
                $domoprimeRequest = $meeting->domoprimeRequest;
                if ($domoprimeRequest) {
                    $domoprimeRequest->update($filtered);
                } else {
                    $filtered['meeting_id'] = $meeting->id;
                    $filtered['customer_id'] = $meeting->customer_id;
                    \Modules\AppDomoprime\Entities\DomoprimeIsoCustomerRequest::create($filtered);
                }
            }
        }

        // Update products
        if (isset($request->products)) {
            $meeting->products()->delete();
            foreach (($request->products ?? []) as $product) {
                if (isset($product['product_id'])) {
                    $meeting->products()->create([
                        'product_id' => $product['product_id'],
                        'details' => $product['details'] ?? null,
                    ]);
                }
            }
        }

        $changes = array_diff_assoc($data, $oldData);
        if (! empty($changes)) {
            $this->repository->logHistory($meeting, 'Meeting updated: ' . json_encode($changes), $request->user());
        }

        DB::commit();

        return response()->json([
            'success' => true,
            'message' => 'Meeting updated successfully',
            'data' => new MeetingResource($this->repository->findWithRelations($meeting->id)),
        ]);
    }

    public function destroy(int $id, Request $request): JsonResponse
    {
        $meeting = $this->repository->find($id);

        if (! $meeting) {
            return response()->json(['success' => false, 'message' => 'Meeting not found'], 404);
        }

        DB::beginTransaction();

        $this->repository->softDelete($meeting);
        $this->repository->logHistory($meeting, 'Meeting deleted', $request->user());

        DB::commit();

        return response()->json(['success' => true, 'message' => 'Meeting deleted successfully']);
    }

    /**
     * GET /meetings/schedule
     * Returns meetings for a date range, formatted for a calendar view.
     * Query params: start (date), end (date), plus all standard filters.
     */
    public function schedule(Request $request): JsonResponse
    {
        $user = $request->user();

        $start = $request->query('start', now()->startOfWeek()->toDateString());
        $end = $request->query('end', now()->endOfWeek()->toDateString());

        $filters = array_merge($request->all(), [
            'in_at_from' => $start,
            'in_at_to' => $end,
            'status' => $request->query('status', 'ACTIVE'),
        ]);

        $meetings = $this->repository->getScheduleMeetings($filters);

        $events = $meetings->map(function ($meeting) {
            $customer = $meeting->customer;
            $address = $customer?->addresses?->first();
            $status = $meeting->meetingStatus;
            $statusCall = $meeting->statusCall;

            // Calendar end = in_at + 1h (meetings are single-day, only in_at matters)
            $eventEnd = $meeting->in_at
                ? \Carbon\Carbon::parse($meeting->in_at)->addHour()->toDateTimeString()
                : null;

            return [
                'id' => $meeting->id,
                'title' => $customer
                    ? mb_strtoupper(trim($customer->lastname . ' ' . $customer->firstname))
                    : 'Meeting #' . $meeting->id,
                'start' => $meeting->in_at,
                'end' => $eventEnd,
                'backgroundColor' => $status?->color ?: '#3788d8',
                'borderColor' => $status?->color ?: '#3788d8',
                'extendedProps' => [
                    'meeting_id' => $meeting->id,
                    'registration' => $meeting->registration,
                    'customer' => $customer ? [
                        'id' => $customer->id,
                        'name' => mb_strtoupper(trim($customer->lastname . ' ' . $customer->firstname)),
                        'phone' => $customer->phone,
                        'mobile' => $customer->mobile,
                        'postcode' => $address?->postcode,
                        'city' => $address?->city,
                        'address' => $address?->address1,
                    ] : null,
                    'status' => $status ? [
                        'id' => $status->id,
                        'name' => $status->translations->first()?->value ?? $status->name,
                        'color' => $status->color,
                        'icon' => $status->icon,
                    ] : null,
                    'status_call' => $statusCall ? [
                        'id' => $statusCall->id,
                        'name' => $statusCall->translations->first()?->value ?? $statusCall->name,
                        'color' => $statusCall->color,
                    ] : null,
                    'telepro' => $meeting->telepro ? [
                        'id' => $meeting->telepro->id,
                        'name' => mb_strtoupper(trim($meeting->telepro->lastname . ' ' . $meeting->telepro->firstname)),
                    ] : null,
                    'sales' => $meeting->sales ? [
                        'id' => $meeting->sales->id,
                        'name' => mb_strtoupper(trim($meeting->sales->lastname . ' ' . $meeting->sales->firstname)),
                    ] : null,
                    'sale2' => $meeting->sale2 ? [
                        'id' => $meeting->sale2->id,
                        'name' => mb_strtoupper(trim($meeting->sale2->lastname . ' ' . $meeting->sale2->firstname)),
                    ] : null,
                    'assistant' => $meeting->assistant ? [
                        'id' => $meeting->assistant->id,
                        'name' => mb_strtoupper(trim($meeting->assistant->lastname . ' ' . $meeting->assistant->firstname)),
                    ] : null,
                    'callcenter' => $meeting->callcenter ? [
                        'id' => $meeting->callcenter->id,
                        'name' => $meeting->callcenter->name,
                    ] : null,
                    'campaign' => $meeting->campaign ? [
                        'id' => $meeting->campaign->id,
                        'name' => $meeting->campaign->name,
                    ] : null,
                    'is_confirmed' => $meeting->is_confirmed,
                    'in_at' => $meeting->in_at,
                    'out_at' => $meeting->out_at,
                    'remarks' => $meeting->remarks,
                ],
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $events,
            'meta' => [
                'total' => $meetings->count(),
                'start' => $start,
                'end' => $end,
            ],
        ]);
    }

    public function filterOptions(Request $request): JsonResponse
    {
        $lang = $request->query('lang', 'fr');

        return response()->json([
            'success' => true,
            'data' => $this->repository->getFilterOptions($lang),
        ]);
    }

    public function statistics(): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $this->repository->getStatistics()]);
    }

    public function history(int $id): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $this->repository->getHistory($id)]);
    }

    /**
     * GET /meetings/{id}/duplicate-mobile
     * List meetings with same mobile number (like Symfony "RDVs avec le même mobile" tab).
     */
    public function duplicateMobile(int $id): JsonResponse
    {
        $meeting = \Modules\CustomersMeetings\Entities\CustomerMeeting::with('customer')->find($id);

        if (!$meeting || !$meeting->customer) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $mobile = $meeting->customer->mobile;

        if (!$mobile) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $duplicates = \Modules\CustomersMeetings\Entities\CustomerMeeting::query()
            ->join('t_customers', 't_customers.id', '=', 't_customers_meeting.customer_id')
            ->where('t_customers.mobile', $mobile)
            ->where('t_customers_meeting.id', '!=', $id)
            ->where('t_customers_meeting.status', 'ACTIVE')
            ->select('t_customers_meeting.id', 't_customers_meeting.in_at', 't_customers_meeting.state_id',
                't_customers.firstname', 't_customers.lastname', 't_customers.phone', 't_customers.mobile')
            ->orderByDesc('t_customers_meeting.in_at')
            ->limit(50)
            ->get();

        return response()->json(['success' => true, 'data' => $duplicates]);
    }

    protected function resolveCustomerData(array $data, ?int $existingCustomerId = null): array
    {
        if (! isset($data['customer'])) {
            return $data;
        }

        $customerData = $data['customer'];
        unset($data['customer']);

        $customerFields = array_filter([
            'lastname' => $customerData['lastname'] ?? null,
            'firstname' => $customerData['firstname'] ?? null,
            'phone' => $customerData['phone'] ?? null,
            'email' => $customerData['email'] ?? null,
            'mobile' => $customerData['mobile'] ?? null,
            'mobile2' => $customerData['mobile2'] ?? null,
            'gender' => $customerData['gender'] ?? null,
            'company' => $customerData['company'] ?? null,
            'union_id' => $customerData['union_id'] ?? 0,
            'status' => 'ACTIVE',
        ], function ($value) {
            return $value !== null;
        });

        $customer = \Modules\Customer\Entities\Customer::updateOrCreate(
            $existingCustomerId
                ? ['id' => $existingCustomerId]
                : ['lastname' => $customerData['lastname'], 'firstname' => $customerData['firstname'], 'phone' => $customerData['phone']],
            $customerFields
        );

        if (isset($customerData['address'])) {
            $addr = $customerData['address'];

            $addressFields = [
                'address2' => $addr['address2'] ?? '',
                'country' => $addr['country'] ?? 'FR',
                'state' => $addr['state'] ?? '',
                'coordinates' => $addr['coordinates'] ?? '',
                'status' => 'ACTIVE',
            ];


            \Modules\Customer\Entities\CustomerAddress::updateOrCreate(
                ['customer_id' => $customer->id, 'address1' => $addr['address1'], 'postcode' => $addr['postcode'], 'city' => $addr['city']],
                $addressFields
            );
        }

        $data['customer_id'] = $customer->id;

        return $data;
    }
}
