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
use Modules\CustomersContracts\Entities\ServicesImpotVerifRequest;
use Modules\CustomersContracts\Entities\ServicesImpotVerifCustomer;
use Modules\AppDomoprime\Entities\DomoprimeIsoCustomerRequest;
use Modules\CustomersContracts\Repositories\ContractRepository;

class ContractController extends Controller
{
    public function __construct(protected ContractRepository $repository)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Data permissions: gates which fields are included in the JSON response
        // These use FIELD_PERMISSIONS (data-level credentials like 'contract_list_view_partner')
        $dataPermissions = ContractListResource::resolvePermittedFields($user);
        ContractListResource::setPermittedFields($dataPermissions);

        // Column visibility: determines which columns the frontend renders.
        // Uses HEADER-level credentials from Symfony template (different from data-level).
        // Example: header uses 'contract_view_list_partner', data uses 'contract_list_view_partner'.
        $visibleColumns = ContractListResource::resolveVisibleColumns($user);

        // permitted_fields = always-visible columns + header-visible columns
        $permittedFields = array_values(array_unique(
            array_merge(ContractListResource::ALWAYS_VISIBLE_COLUMNS, $visibleColumns)
        ));

        // Always load ALL relations: canField() uses isAuthorized() (per-row ownership)
        // so any user might need relations beyond their global $dataPermissions.
        $contracts = $this->repository->getFilteredContracts(
            $request->all(),
            $request->integer('per_page', 15),
            array_keys(ContractListResource::FIELD_PERMISSIONS)
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

        // Extract nested data before resolving customer
        $isoData = $data['iso'] ?? null;
        $verifData = $data['verif'] ?? [];
        unset($data['iso'], $data['verif']);

        $data = $this->resolveCustomerData($data);

        if (empty($data['reference'])) {
            $data['reference'] = $this->repository->generateReference();
        }
        $data['status'] = $data['status'] ?? 'ACTIVE';

        $contract = $this->repository->create($data);

        // Save products
        if (! empty($request->products)) {
            foreach ($request->products as $product) {
                $contract->products()->create([
                    'product_id' => $product['product_id'],
                    'details' => $product['details'] ?? null,
                ]);
            }
        }

        // Save ISO (Domoprime) data
        if ($isoData && array_filter($isoData)) {
            $isoData['contract_id'] = $contract->id;
            $isoData['customer_id'] = $contract->customer_id;
            DomoprimeIsoCustomerRequest::create($isoData);
        }

        // Save fiscal verification entries
        foreach ($verifData as $entry) {
            if (empty($entry['reference']) && empty($entry['number'])) {
                continue;
            }

            $verifRequest = ServicesImpotVerifRequest::create([
                'reference' => $entry['reference'] ?? '',
                'number' => $entry['number'] ?? '',
                'status' => 'ACTIVE',
            ]);

            ServicesImpotVerifCustomer::create([
                'customer_id' => $contract->customer_id,
                'request_id' => $verifRequest->id,
            ]);
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

        $customerFields = [
            'lastname' => $customerData['lastname'],
            'firstname' => $customerData['firstname'],
            'phone' => $customerData['phone'],
            'email' => $customerData['email'] ?? '',
            'mobile' => $customerData['mobile'] ?? '',
            'mobile2' => $customerData['mobile2'] ?? '',
            'gender' => $customerData['gender'] ?? null,
            'company' => $customerData['company'] ?? '',
            'union_id' => $customerData['union_id'] ?? 0,
            'status' => 'ACTIVE',
        ];

        $customer = \Modules\Customer\Entities\Customer::updateOrCreate(
            $existingCustomerId
                ? ['id' => $existingCustomerId]
                : ['lastname' => $customerData['lastname'], 'firstname' => $customerData['firstname'], 'phone' => $customerData['phone']],
            $customerFields
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
