<?php

namespace Modules\CustomersContracts\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Modules\CustomersContracts\Entities\CustomerContract;
use Modules\CustomersContracts\Http\Resources\ContractResource;
use Modules\CustomersContracts\Http\Resources\ContractCollection;
use Modules\CustomersContracts\Http\Resources\ContractListResource;
use Modules\CustomersContracts\Http\Resources\ContractListCollection;
use Modules\CustomersContracts\Http\Requests\StoreContractRequest;
use Modules\CustomersContracts\Http\Requests\UpdateContractRequest;
use Modules\CustomersContracts\Repositories\ContractRepository;

/**
 * Contract Controller (TENANT DATABASE)
 *
 * Manages customer contracts with filtering, pagination, and CRUD operations
 */
class ContractController extends Controller
{
    protected $repository;

    public function __construct(ContractRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Display a paginated listing of contracts with filters
     *
     * Supported filters:
     * - reference: Contract reference (search)
     * - customer_id: Filter by customer ID
     * - state_id: Filter by status ID
     * - install_state_id: Filter by installation status
     * - admin_status_id: Filter by admin status
     * - is_signed: Filter by signature status (YES/NO)
     * - status: Filter by active/delete status (ACTIVE/DELETE)
     * - opened_at_from: Filter contracts opened after date
     * - opened_at_to: Filter contracts opened before date
     * - payment_at_from: Filter contracts paid after date
     * - payment_at_to: Filter contracts paid before date
     * - team_id: Filter by team ID
     * - sale_1_id: Filter by sale 1 ID
     * - sale_2_id: Filter by sale 2 ID
     * - manager_id: Filter by manager ID
     * - per_page: Items per page (default 15)
     * - page: Page number
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = $request->input('per_page', 15);
            $contracts = $this->repository->getFilteredContracts($request->all(), $perPage);

            // Use list resource for table display
            return response()->json([
                'success' => true,
                'data' => new ContractListCollection($contracts),
                'meta' => [
                    'current_page' => $contracts->currentPage(),
                    'last_page' => $contracts->lastPage(),
                    'per_page' => $contracts->perPage(),
                    'total' => $contracts->total(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching contracts',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store a newly created contract
     *
     * @param StoreContractRequest $request
     * @return JsonResponse
     */
    public function store(StoreContractRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validatedData = $request->validated();

            // Handle customer creation if customer data is provided
            if (isset($validatedData['customer'])) {
                $customerData = $validatedData['customer'];

                // Create or find customer
                $customer = \Modules\Customer\Entities\Customer::firstOrCreate(
                    [
                        'lastname' => $customerData['lastname'],
                        'firstname' => $customerData['firstname'],
                        'phone' => $customerData['phone'],
                    ],
                    [
                        'status' => 'ACTIVE',
                        'union_id' => $customerData['union_id'] ?? 0,
                    ]
                );

                // Create address if provided
                if (isset($customerData['address'])) {
                    \Modules\Customer\Entities\CustomerAddress::firstOrCreate(
                        [
                            'customer_id' => $customer->id,
                            'address1' => $customerData['address']['address1'],
                            'postcode' => $customerData['address']['postcode'],
                            'city' => $customerData['address']['city'],
                        ],
                        [
                            'address2' => $customerData['address']['address2'] ?? '',
                            'country' => $customerData['address']['country'] ?? 'FR',
                            'state' => $customerData['address']['state'] ?? '',
                            'coordinates' => $customerData['address']['coordinates'] ?? '',
                            'status' => 'ACTIVE',
                        ]
                    );
                }

                // Set customer_id for contract
                $validatedData['customer_id'] = $customer->id;

                // Remove customer nested data
                unset($validatedData['customer']);
            }

            // Generate reference if not provided
            if (empty($validatedData['reference'])) {
                $validatedData['reference'] = $this->repository->generateReference();
            }

            // Set default status if not provided
            if (empty($validatedData['status'])) {
                $validatedData['status'] = 'ACTIVE';
            }

            $contract = $this->repository->create($validatedData);

            // Handle products if provided
            if (isset($request->products) && is_array($request->products)) {
                foreach ($request->products as $product) {
                    $contract->products()->create([
                        'product_id' => $product['product_id'],
                        'details' => $product['details'] ?? null,
                    ]);
                }
            }

            // Log history
            $this->repository->logHistory($contract, 'Contract created', $request->user());

            DB::commit();

            // Reload contract with relations
            $contract = $this->repository->findWithRelations($contract->id);

            return response()->json([
                'success' => true,
                'message' => 'Contract created successfully',
                'data' => new ContractResource($contract),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Error creating contract',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified contract
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            $contract = $this->repository->findWithRelations($id);

            if (! $contract) {
                return response()->json([
                    'success' => false,
                    'message' => 'Contract not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => new ContractResource($contract),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching contract',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update the specified contract
     *
     * @param UpdateContractRequest $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(UpdateContractRequest $request, int $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $contract = $this->repository->find($id);

            if (! $contract) {
                return response()->json([
                    'success' => false,
                    'message' => 'Contract not found',
                ], 404);
            }

            $validatedData = $request->validated();

            // Handle customer update if customer data is provided
            if (isset($validatedData['customer'])) {
                $customerData = $validatedData['customer'];

                // Update or create customer
                $customer = \Modules\Customer\Entities\Customer::updateOrCreate(
                    [
                        'id' => $contract->customer_id,
                    ],
                    [
                        'lastname' => $customerData['lastname'],
                        'firstname' => $customerData['firstname'],
                        'phone' => $customerData['phone'],
                        'union_id' => $customerData['union_id'] ?? 0,
                        'status' => 'ACTIVE',
                    ]
                );

                // Update address if provided
                if (isset($customerData['address'])) {
                    \Modules\Customer\Entities\CustomerAddress::updateOrCreate(
                        [
                            'customer_id' => $customer->id,
                        ],
                        [
                            'address1' => $customerData['address']['address1'],
                            'postcode' => $customerData['address']['postcode'],
                            'city' => $customerData['address']['city'],
                            'address2' => $customerData['address']['address2'] ?? '',
                            'country' => $customerData['address']['country'] ?? 'FR',
                            'state' => $customerData['address']['state'] ?? '',
                            'coordinates' => $customerData['address']['coordinates'] ?? '',
                            'status' => 'ACTIVE',
                        ]
                    );
                }

                // Update customer_id in validated data
                $validatedData['customer_id'] = $customer->id;

                // Remove customer nested data
                unset($validatedData['customer']);
            }

            $oldData = $contract->toArray();
            $contract = $this->repository->update($contract, $validatedData);

            // Handle products update if provided
            if (isset($request->products)) {
                // Delete existing products
                $contract->products()->delete();

                // Create new products
                if (is_array($request->products)) {
                    foreach ($request->products as $product) {
                        if (isset($product['product_id'])) {
                            $contract->products()->create([
                                'product_id' => $product['product_id'],
                                'details' => $product['details'] ?? null,
                            ]);
                        }
                    }
                }
            }

            // Log changes
            $changes = array_diff_assoc($validatedData, $oldData);
            if (! empty($changes)) {
                $this->repository->logHistory(
                    $contract,
                    'Contract updated: '.json_encode($changes),
                    $request->user()
                );
            }

            DB::commit();

            // Reload contract with relations
            $contract = $this->repository->findWithRelations($contract->id);

            return response()->json([
                'success' => true,
                'message' => 'Contract updated successfully',
                'data' => new ContractResource($contract),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Error updating contract',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Soft delete the specified contract (mark as DELETE)
     *
     * @param int $id
     * @param Request $request
     * @return JsonResponse
     */
    public function destroy(int $id, Request $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $contract = $this->repository->find($id);

            if (! $contract) {
                return response()->json([
                    'success' => false,
                    'message' => 'Contract not found',
                ], 404);
            }

            $this->repository->softDelete($contract);
            $this->repository->logHistory($contract, 'Contract deleted', $request->user());

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Contract deleted successfully',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Error deleting contract',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get contract statistics
     *
     * @return JsonResponse
     */
    public function statistics(): JsonResponse
    {
        try {
            $stats = $this->repository->getStatistics();

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching statistics',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get contract history
     *
     * @param int $id
     * @return JsonResponse
     */
    public function history(int $id): JsonResponse
    {
        try {
            $history = $this->repository->getHistory($id);

            return response()->json([
                'success' => true,
                'data' => $history,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching history',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
