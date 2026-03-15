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
