# CustomersContracts Module - Troubleshooting Guide

## ❌ Error: "contracts.map is not a function"

### Cause
The `contracts` variable is not an array. This can happen when:
1. The API returns data in an unexpected format
2. The API request fails and returns an error object
3. The response structure doesn't match our TypeScript types

### Solution Applied ✅

We've updated the code to handle multiple response formats:

**File: `admin/hooks/useContracts.ts`**
```typescript
// Now handles both formats:
// Format 1: { success: true, data: [...] }
// Format 2: { success: true, data: { contracts: [...] } }

if (Array.isArray(response.data)) {
  contractsData = response.data;
} else if (response.data && typeof response.data === 'object' && 'contracts' in response.data) {
  contractsData = response.data.contracts;
}
```

**File: `admin/components/ContractsList1.tsx`**
```typescript
// Added array checks before mapping
{Array.isArray(contracts) && contracts.map((contract) => (...))}
```

### Debug Steps

If the error persists, follow these steps:

#### 1. Check API Response Format

Open browser DevTools (F12) → Network tab → Find the request to:
```
/api/admin/customerscontracts/contracts
```

Look at the Response tab and check the format:

**Expected Format 1 (Direct Array):**
```json
{
  "success": true,
  "data": [
    { "id": 1, "reference": "CONT-001", ... },
    { "id": 2, "reference": "CONT-002", ... }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 10,
    "per_page": 15,
    "total": 150
  }
}
```

**Expected Format 2 (Nested Object):**
```json
{
  "success": true,
  "data": {
    "contracts": [
      { "id": 1, "reference": "CONT-001", ... },
      { "id": 2, "reference": "CONT-002", ... }
    ]
  },
  "meta": {
    "current_page": 1,
    "last_page": 10,
    "per_page": 15,
    "total": 150
  }
}
```

**Unexpected Format (Error):**
```json
{
  "success": false,
  "error": "Some error message",
  "data": null
}
```

#### 2. Add Console Logging

Temporarily add this to `admin/hooks/useContracts.ts` after line 89:

```typescript
const response = await contractsService.getContracts({
  ...filters,
  page: currentPage,
  per_page: perPage,
});

// ADD THESE LINES FOR DEBUGGING:
console.log('🔍 API Response:', response);
console.log('🔍 Response.data:', response.data);
console.log('🔍 Is Array?', Array.isArray(response.data));
console.log('🔍 Has contracts key?', response.data && 'contracts' in response.data);
```

#### 3. Check Backend Controller Response

Verify your Laravel controller returns the correct format.

**File:** `Modules/CustomersContracts/Http/Controllers/Admin/ContractController.php`

**Expected code:**
```php
public function index(Request $request)
{
    $filters = $request->all();
    $contracts = $this->repository->getFilteredContracts($filters);

    // Option 1: Return with ContractCollection
    return new ContractCollection($contracts);

    // Option 2: Return directly
    return response()->json([
        'success' => true,
        'data' => $contracts->items(),
        'meta' => [
            'current_page' => $contracts->currentPage(),
            'last_page' => $contracts->lastPage(),
            'per_page' => $contracts->perPage(),
            'total' => $contracts->total(),
        ]
    ]);
}
```

**Check ContractCollection** (`Http/Resources/ContractCollection.php`):
```php
public function toArray($request)
{
    return [
        'success' => true,
        'data' => $this->collection,  // Should be an array
        'meta' => [
            'current_page' => $this->currentPage(),
            'last_page' => $this->lastPage(),
            'per_page' => $this->perPage(),
            'total' => $this->total(),
        ]
    ];
}
```

#### 4. Test API Directly

Use Postman or curl to test the endpoint:

```bash
curl -X GET "http://localhost:8000/api/admin/customerscontracts/contracts" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "X-Tenant-ID: 1" \
  -H "Accept: application/json"
```

#### 5. Check for Empty Database

If the database is empty, verify:

```sql
-- Check if contracts exist
SELECT COUNT(*) FROM t_customers_contract WHERE status = 'ACTIVE';

-- Check all contracts
SELECT id, reference, customer_id, status FROM t_customers_contract LIMIT 10;
```

#### 6. Verify Backend Routes

```bash
cd C:\laragon\www\backend-api
php artisan route:list --path=customerscontracts
```

Should show:
```
GET  api/admin/customerscontracts/contracts  › ContractController@index
```

## Other Common Errors

### Error: 401 Unauthorized

**Cause:** Missing or invalid authentication token

**Solution:**
1. Check localStorage has `auth_token`
2. Login again to refresh token
3. Verify token format: `Bearer {token}`

### Error: 404 Not Found

**Cause:** Route doesn't exist or module not registered

**Solution:**
1. Verify menu entry in `system_menu` table
2. Check module folder exists: `src/modules/CustomersContracts`
3. Verify component export: `export default function ContractsList1()`
4. Restart Next.js dev server

### Error: 500 Internal Server Error

**Cause:** Backend error (database, code error, etc.)

**Solution:**
1. Check Laravel logs: `C:\laragon\www\backend-api\storage\logs\laravel.log`
2. Verify database tables exist (prefix `t_`)
3. Check database connection
4. Run migrations: `php artisan migrate`

### Empty Statistics Cards

**Cause:** Statistics endpoint failed or returned invalid data

**Solution:**
The statistics are loaded separately. Check:
1. Network tab for `/api/admin/customerscontracts/contracts/statistics`
2. Backend method: `ContractController@statistics`
3. Console for errors (stats errors don't block the main list)

## Debug Checklist

- [ ] Open browser console (F12)
- [ ] Check for JavaScript errors
- [ ] Check Network tab for failed requests
- [ ] Verify API response format matches expected structure
- [ ] Confirm `contracts` is an array before render
- [ ] Check localStorage has valid `auth_token`
- [ ] Verify backend is running (`http://localhost:8000`)
- [ ] Check database has contract records
- [ ] Verify menu entry exists and is ACTIVE
- [ ] Check component file exists at correct path
- [ ] Restart both frontend and backend servers

## Contact & Support

If issues persist after following this guide:

1. **Check logs:**
   - Frontend: Browser console
   - Backend: `C:\laragon\www\backend-api\storage\logs\laravel.log`

2. **Verify versions:**
   - Next.js: `npm list next`
   - React: `npm list react`
   - Node: `node --version`
   - PHP: `php --version`

3. **Test with minimal data:**
   - Create one test contract manually in database
   - Try to load it in the interface

4. **Compare with working module:**
   - Check how Customers module works
   - Compare API response formats
   - Verify similar patterns

---

**Last Updated:** 2024
**Module Version:** 1.0.0
