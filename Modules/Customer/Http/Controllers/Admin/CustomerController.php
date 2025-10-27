<?php

namespace Modules\Customer\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Customer\Entities\Customer;
use Modules\Customer\Http\Requests\StoreCustomerRequest;
use Modules\Customer\Http\Requests\UpdateCustomerRequest;
use Illuminate\Support\Facades\DB;

/**
 * Customer Controller (TENANT DATABASE)
 * Manages customer operations for the tenant
 */
class CustomerController extends Controller
{
    /**
     * Display a paginated listing of customers.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $status = $request->input('status', 'ACTIVE');

            $query = Customer::query()
                ->with(['union', 'addresses', 'primaryContact'])
                ->active();

            // Apply search filter
            if ($search) {
                $query->search($search);
            }

            // Apply status filter
            if ($status) {
                $query->where('status', $status);
            }

            // Apply sorting
            $sortBy = $request->input('sort_by', 'created_at');
            $sortOrder = $request->input('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Paginate results
            $customers = $query->paginate($perPage);

            // Transform data to include computed fields
            $customers->getCollection()->transform(function ($customer) {
                return [
                    'id' => $customer->id,
                    'company' => $customer->company,
                    'gender' => $customer->gender,
                    'firstname' => $customer->firstname,
                    'lastname' => $customer->lastname,
                    'full_name' => $customer->full_name,
                    'display_name' => $customer->display_name,
                    'email' => $customer->email,
                    'phone' => $customer->phone,
                    'mobile' => $customer->mobile,
                    'mobile2' => $customer->mobile2,
                    'phone1' => $customer->phone1,
                    'birthday' => $customer->birthday?->format('Y-m-d'),
                    'age' => $customer->age,
                    'salary' => $customer->salary,
                    'occupation' => $customer->occupation,
                    'status' => $customer->status,
                    'union' => $customer->union ? [
                        'id' => $customer->union->id,
                        'name' => $customer->union->name,
                    ] : null,
                    'primary_address' => $customer->addresses->first() ? [
                        'id' => $customer->addresses->first()->id,
                        'full_address' => $customer->addresses->first()->full_address,
                        'city' => $customer->addresses->first()->city,
                        'postcode' => $customer->addresses->first()->postcode,
                    ] : null,
                    'primary_contact' => $customer->primaryContact ? [
                        'id' => $customer->primaryContact->id,
                        'full_name' => $customer->primaryContact->full_name,
                        'email' => $customer->primaryContact->email,
                        'phone' => $customer->primaryContact->phone,
                    ] : null,
                    'created_at' => $customer->created_at->format('Y-m-d H:i:s'),
                    'updated_at' => $customer->updated_at->format('Y-m-d H:i:s'),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $customers->items(),
                'meta' => [
                    'current_page' => $customers->currentPage(),
                    'last_page' => $customers->lastPage(),
                    'per_page' => $customers->perPage(),
                    'total' => $customers->total(),
                    'from' => $customers->firstItem(),
                    'to' => $customers->lastItem(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching customers',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified customer with all relations.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            $customer = Customer::with([
                'union',
                'addresses',
                'contacts',
                'houses.address',
                'financial',
            ])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $customer->id,
                    'company' => $customer->company,
                    'gender' => $customer->gender,
                    'firstname' => $customer->firstname,
                    'lastname' => $customer->lastname,
                    'full_name' => $customer->full_name,
                    'display_name' => $customer->display_name,
                    'email' => $customer->email,
                    'phone' => $customer->phone,
                    'mobile' => $customer->mobile,
                    'mobile2' => $customer->mobile2,
                    'phone1' => $customer->phone1,
                    'birthday' => $customer->birthday?->format('Y-m-d'),
                    'age' => $customer->age,
                    'salary' => $customer->salary,
                    'occupation' => $customer->occupation,
                    'status' => $customer->status,
                    'union' => $customer->union,
                    'addresses' => $customer->addresses,
                    'contacts' => $customer->contacts,
                    'houses' => $customer->houses,
                    'financial' => $customer->financial,
                    'created_at' => $customer->created_at->format('Y-m-d H:i:s'),
                    'updated_at' => $customer->updated_at->format('Y-m-d H:i:s'),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Store a newly created customer.
     *
     * @param StoreCustomerRequest $request
     * @return JsonResponse
     */
    public function store(StoreCustomerRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $customer = Customer::create([
                'company' => $request->input('company'),
                'gender' => $request->input('gender'),
                'firstname' => $request->input('firstname'),
                'lastname' => $request->input('lastname'),
                'email' => $request->input('email'),
                'phone' => $request->input('phone'),
                'mobile' => $request->input('mobile'),
                'mobile2' => $request->input('mobile2'),
                'phone1' => $request->input('phone1'),
                'birthday' => $request->input('birthday'),
                'union_id' => $request->input('union_id', 0),
                'age' => $request->input('age'),
                'salary' => $request->input('salary'),
                'occupation' => $request->input('occupation'),
                'status' => 'ACTIVE',
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Customer created successfully',
                'data' => $customer,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Error creating customer',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update the specified customer.
     *
     * @param UpdateCustomerRequest $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(UpdateCustomerRequest $request, int $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $customer = Customer::findOrFail($id);

            $customer->update([
                'company' => $request->input('company', $customer->company),
                'gender' => $request->input('gender', $customer->gender),
                'firstname' => $request->input('firstname', $customer->firstname),
                'lastname' => $request->input('lastname', $customer->lastname),
                'email' => $request->input('email', $customer->email),
                'phone' => $request->input('phone', $customer->phone),
                'mobile' => $request->input('mobile', $customer->mobile),
                'mobile2' => $request->input('mobile2', $customer->mobile2),
                'phone1' => $request->input('phone1', $customer->phone1),
                'birthday' => $request->input('birthday', $customer->birthday),
                'union_id' => $request->input('union_id', $customer->union_id),
                'age' => $request->input('age', $customer->age),
                'salary' => $request->input('salary', $customer->salary),
                'occupation' => $request->input('occupation', $customer->occupation),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Customer updated successfully',
                'data' => $customer->fresh(),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Error updating customer',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Soft delete the specified customer (mark as DELETE).
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $customer = Customer::findOrFail($id);
            $customer->update(['status' => 'DELETE']);

            return response()->json([
                'success' => true,
                'message' => 'Customer deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting customer',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get customer statistics.
     *
     * @return JsonResponse
     */
    public function stats(): JsonResponse
    {
        try {
            $stats = [
                'total_customers' => Customer::active()->count(),
                'total_deleted' => Customer::where('status', 'DELETE')->count(),
                'with_company' => Customer::active()->whereNotNull('company')->where('company', '!=', '')->count(),
                'with_email' => Customer::active()->whereNotNull('email')->where('email', '!=', '')->count(),
                'with_mobile' => Customer::active()->whereNotNull('mobile')->where('mobile', '!=', '')->count(),
            ];

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
}
