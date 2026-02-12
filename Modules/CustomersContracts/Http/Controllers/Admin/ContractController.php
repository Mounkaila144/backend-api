<?php

namespace Modules\CustomersContracts\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Modules\CustomersContracts\Http\Resources\ContractResource;
use Modules\CustomersContracts\Http\Resources\ContractListResource;
use Modules\CustomersContracts\Http\Resources\ContractListCollection;
use Modules\CustomersContracts\Http\Requests\StoreContractRequest;
use Modules\CustomersContracts\Http\Requests\UpdateContractRequest;
use Modules\CustomersContracts\Repositories\ContractRepository;

class ContractController extends Controller
{
    public function __construct(protected ContractRepository $repository)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $permittedFields = ContractListResource::resolvePermittedFields($user);
        ContractListResource::setPermittedFields($permittedFields);

        $contracts = $this->repository->getFilteredContracts(
            $request->all(),
            $request->integer('per_page', 15),
            $permittedFields
        );

        return response()->json([
            'success' => true,
            'data' => new ContractListCollection($contracts),
            'meta' => [
                'current_page' => $contracts->currentPage(),
                'last_page' => $contracts->lastPage(),
                'per_page' => $contracts->perPage(),
                'total' => $contracts->total(),
                'permitted_fields' => $permittedFields,
            ],
        ]);
    }

    public function store(StoreContractRequest $request): JsonResponse
    {
        $data = $request->validated();

        DB::beginTransaction();

        $data = $this->resolveCustomerData($data);

        if (empty($data['reference'])) {
            $data['reference'] = $this->repository->generateReference();
        }
        $data['status'] = $data['status'] ?? 'ACTIVE';

        $contract = $this->repository->create($data);

        if (! empty($request->products)) {
            foreach ($request->products as $product) {
                $contract->products()->create([
                    'product_id' => $product['product_id'],
                    'details' => $product['details'] ?? null,
                ]);
            }
        }

        $this->repository->logHistory($contract, 'Contract created', $request->user());

        DB::commit();

        return response()->json([
            'success' => true,
            'message' => 'Contract created successfully',
            'data' => new ContractResource($this->repository->findWithRelations($contract->id)),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $contract = $this->repository->findWithRelations($id);

        if (! $contract) {
            return response()->json(['success' => false, 'message' => 'Contract not found'], 404);
        }

        return response()->json(['success' => true, 'data' => new ContractResource($contract)]);
    }

    public function update(UpdateContractRequest $request, int $id): JsonResponse
    {
        $contract = $this->repository->find($id);

        if (! $contract) {
            return response()->json(['success' => false, 'message' => 'Contract not found'], 404);
        }

        $data = $request->validated();

        DB::beginTransaction();

        $data = $this->resolveCustomerData($data, $contract->customer_id);

        $oldData = $contract->toArray();
        $contract = $this->repository->update($contract, $data);

        if (isset($request->products)) {
            $contract->products()->delete();
            foreach (($request->products ?? []) as $product) {
                if (isset($product['product_id'])) {
                    $contract->products()->create([
                        'product_id' => $product['product_id'],
                        'details' => $product['details'] ?? null,
                    ]);
                }
            }
        }

        $changes = array_diff_assoc($data, $oldData);
        if (! empty($changes)) {
            $this->repository->logHistory($contract, 'Contract updated: ' . json_encode($changes), $request->user());
        }

        DB::commit();

        return response()->json([
            'success' => true,
            'message' => 'Contract updated successfully',
            'data' => new ContractResource($this->repository->findWithRelations($contract->id)),
        ]);
    }

    public function destroy(int $id, Request $request): JsonResponse
    {
        $contract = $this->repository->find($id);

        if (! $contract) {
            return response()->json(['success' => false, 'message' => 'Contract not found'], 404);
        }

        DB::beginTransaction();

        $this->repository->softDelete($contract);
        $this->repository->logHistory($contract, 'Contract deleted', $request->user());

        DB::commit();

        return response()->json(['success' => true, 'message' => 'Contract deleted successfully']);
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
     * Resolve nested customer data into a customer_id.
     * Handles create (firstOrCreate) or update (updateOrCreate) depending on $existingCustomerId.
     */
    protected function resolveCustomerData(array $data, ?int $existingCustomerId = null): array
    {
        if (! isset($data['customer'])) {
            return $data;
        }

        $customerData = $data['customer'];
        unset($data['customer']);

        $customer = $existingCustomerId
            ? \Modules\Customer\Entities\Customer::updateOrCreate(
                ['id' => $existingCustomerId],
                [
                    'lastname' => $customerData['lastname'],
                    'firstname' => $customerData['firstname'],
                    'phone' => $customerData['phone'],
                    'union_id' => $customerData['union_id'] ?? 0,
                    'status' => 'ACTIVE',
                ]
            )
            : \Modules\Customer\Entities\Customer::firstOrCreate(
                ['lastname' => $customerData['lastname'], 'firstname' => $customerData['firstname'], 'phone' => $customerData['phone']],
                ['status' => 'ACTIVE', 'union_id' => $customerData['union_id'] ?? 0]
            );

        if (isset($customerData['address'])) {
            $addr = $customerData['address'];
            \Modules\Customer\Entities\CustomerAddress::updateOrCreate(
                ['customer_id' => $customer->id, 'address1' => $addr['address1'], 'postcode' => $addr['postcode'], 'city' => $addr['city']],
                [
                    'address2' => $addr['address2'] ?? '',
                    'country' => $addr['country'] ?? 'FR',
                    'state' => $addr['state'] ?? '',
                    'coordinates' => $addr['coordinates'] ?? '',
                    'status' => 'ACTIVE',
                ]
            );
        }

        $data['customer_id'] = $customer->id;

        return $data;
    }
}
