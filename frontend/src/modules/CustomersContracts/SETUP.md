# ✅ CustomersContracts Module - Setup Guide

## 📋 Module Information

**Module Name:** CustomersContracts
**Route:** `/admin/customers-contracts/contracts-list1`
**Component:** `ContractsList1.tsx`
**Import Path:** `@/src/modules/CustomersContracts/admin/components/ContractsList1.tsx`

## 🚀 Installation Steps

### Step 1: Add Menu Entry to Database

You need to add an entry to the `system_menu` table in your **central database**.

#### Option A - SQL Script

Create a file `database/sql/add_customers_contracts_menu.sql` in your backend:

```sql
-- Add CustomersContracts menu entry
INSERT INTO `system_menu` (
    `name`,
    `module`,
    `menu`,
    `lb`,
    `rb`,
    `level`,
    `status`,
    `type`,
    `translation`,
    `created_at`,
    `updated_at`
) VALUES (
    '0000_contracts-list1',           -- Name (matches route segment)
    'customers-contracts',             -- Module name (matches route segment)
    '',                                -- Parent menu (empty for root)
    100,                               -- Left bound (adjust based on your menu structure)
    101,                               -- Right bound (adjust based on your menu structure)
    2,                                 -- Level (2 = menu item)
    'ACTIVE',                          -- Status
    'SYSTEM',                          -- Type
    'Contracts Management',            -- Translation/Label
    NOW(),                             -- Created at
    NOW()                              -- Updated at
);
```

Execute the SQL:
```bash
cd C:\laragon\www\backend-api
mysql -u root -p your_database_name < database/sql/add_customers_contracts_menu.sql
```

#### Option B - Direct MySQL

Open phpMyAdmin or MySQL client and run:

```sql
INSERT INTO `system_menu` (
    `name`, `module`, `menu`, `lb`, `rb`, `level`, `status`, `type`, `translation`, `created_at`, `updated_at`
) VALUES (
    '0000_contracts-list1', 'customers-contracts', '', 100, 101, 2, 'ACTIVE', 'SYSTEM', 'Contracts Management', NOW(), NOW()
);
```

**Important:** Adjust `lb` and `rb` values according to your existing menu structure. These values should not overlap with existing menu items.

### Step 2: Verify Backend is Running

```bash
cd C:\laragon\www\backend-api
php artisan serve
```

Backend should be accessible at `http://localhost:8000`

### Step 3: Verify Backend Routes

```bash
cd C:\laragon\www\backend-api
php artisan route:list --path=customerscontracts
```

Expected output:
```
GET|HEAD  api/admin/customerscontracts/contracts              › admin.customerscontracts.contracts.index
POST      api/admin/customerscontracts/contracts              › admin.customerscontracts.contracts.store
GET|HEAD  api/admin/customerscontracts/contracts/statistics   › admin.customerscontracts.contracts.statistics
GET|HEAD  api/admin/customerscontracts/contracts/{id}         › admin.customerscontracts.contracts.show
PUT       api/admin/customerscontracts/contracts/{id}         › admin.customerscontracts.contracts.update
DELETE    api/admin/customerscontracts/contracts/{id}         › admin.customerscontracts.contracts.destroy
GET|HEAD  api/admin/customerscontracts/contracts/{id}/history › admin.customerscontracts.contracts.history
```

### Step 4: Verify Frontend is Running

```bash
cd C:\Users\Mounkaila\PhpstormProjects\icall26
npm run dev
```

Frontend should be accessible at `http://localhost:3000`

### Step 5: Test the Module

1. Open your browser
2. Navigate to `http://tenant1.local/admin/login` (or your tenant domain)
3. Login with valid credentials
4. Look for "Contracts Management" in the sidebar menu
5. Click on it - you should be redirected to:
   - **Route:** `/admin/customers-contracts/contracts-list1`
   - **Component:** `ContractsList1`
6. The contracts list should load with statistics and filters

## 📊 Route Generation Logic

Based on your `DYNAMIC-ROUTING.md` documentation:

**Database Entry:**
```json
{
  "module": "customers-contracts",
  "name": "0000_contracts-list1"
}
```

**Generated Route:**
```
/admin/customers-contracts/contracts-list1
```

**Component Resolution:**
1. Convert to PascalCase: `customers-contracts` → `CustomersContracts`
2. Convert to PascalCase: `contracts-list1` → `ContractsList1`
3. Import path: `@/src/modules/CustomersContracts/admin/components/ContractsList1.tsx`

## ✅ Verification Checklist

- [ ] Menu entry exists in `system_menu` table
- [ ] `status = 'ACTIVE'` in menu entry
- [ ] Backend routes respond correctly
- [ ] Backend returns data from tenant database
- [ ] Frontend module exists at correct path
- [ ] Component exports `default function ContractsList1()`
- [ ] Menu item appears in sidebar
- [ ] Clicking menu loads the component
- [ ] Statistics cards display correctly
- [ ] Filters work properly
- [ ] Pagination functions correctly
- [ ] No console errors

## 🔧 Troubleshooting

### Problem 1: Menu doesn't appear

**Solutions:**
- Check `SELECT * FROM system_menu WHERE module = 'customers-contracts'`
- Verify `status = 'ACTIVE'`
- Verify `level > 0` (level 0 = hidden)
- Clear menu cache in frontend
- Refresh the page

### Problem 2: "Module Not Found" error

**Solutions:**
- Verify file exists: `src/modules/CustomersContracts/admin/components/ContractsList1.tsx`
- Check export: `export default function ContractsList1()`
- Verify exact casing (case-sensitive)
- Check `index.ts` exports the component
- Restart Next.js dev server

### Problem 3: API 401/403 errors

**Solutions:**
- Verify user is logged in
- Check `Authorization` header in browser DevTools
- Verify token in localStorage (`auth_token`)
- Check tenant context in request headers
- Verify backend Sanctum authentication

### Problem 4: API 500 errors

**Solutions:**
- Check Laravel logs: `C:\laragon\www\backend-api\storage\logs\laravel.log`
- Verify tables exist in tenant database (prefix `t_`)
- Check database connection
- Verify migrations have run
- Test API endpoint directly with Postman

### Problem 5: Empty data or "No contracts found"

**Solutions:**
- Verify data exists in `t_customers_contract` table
- Check default filters (module defaults to `status = 'ACTIVE'`)
- Try different filter combinations
- Check API response in browser Network tab
- Verify tenant_id is being sent correctly

## 🗄️ Database Tables

**Central Database:**
- `system_menu` - Menu configuration

**Tenant Database (prefix: `t_`):**
- `t_customers_contract` - Main contracts
- `t_customers_contract_product` - Contract products
- `t_customers_contracts_contributor` - Contributors
- `t_customers_contracts_history` - Change history
- `t_customers_contracts_status` - Contract statuses
- `t_customers_contracts_status_i18n` - Status translations
- `t_customers_contracts_admin_status` - Admin statuses
- `t_customers_contracts_admin_status_i18n` - Admin status translations
- `t_customers_contracts_install_status` - Installation statuses
- `t_customers_contracts_install_status_i18n` - Install status translations

## 📝 Next Steps

After successful setup:

1. **Test CRUD Operations:**
   - Create a new contract
   - Edit existing contract
   - View contract details
   - Delete contract (soft delete)

2. **Test Filters:**
   - Search by reference
   - Filter by status (Active/Deleted)
   - Filter by signature (Yes/No)
   - Sort by different fields

3. **Verify Statistics:**
   - Check total contracts count
   - Verify signed vs unsigned count
   - Confirm total revenue calculation

4. **Check History:**
   - Create a contract
   - Edit the contract
   - View contract details
   - Check history tab shows changes

## 📚 Related Files

- **Module:** `C:\Users\Mounkaila\PhpstormProjects\icall26\src\modules\CustomersContracts\`
- **Backend:** `C:\laragon\www\backend-api\Modules\CustomersContracts\`
- **Documentation:** `C:\Users\Mounkaila\PhpstormProjects\icall26\src\modules\CustomersContracts\README.md`
- **Route Config:** `C:\Users\Mounkaila\PhpstormProjects\icall26\DYNAMIC-ROUTING.md`

## 🎉 Success Indicators

When everything is working correctly, you should see:

1. ✅ "Contracts Management" menu item in sidebar
2. ✅ Route: `/admin/customers-contracts/contracts-list1`
3. ✅ 4 statistics cards at the top
4. ✅ Filter bar with search and dropdowns
5. ✅ Contracts table with data
6. ✅ Pagination controls at bottom
7. ✅ No errors in browser console
8. ✅ API calls successful (200 status)

---

**Module Version:** 1.0.0
**Last Updated:** 2024
**Status:** ✅ Ready for Production
