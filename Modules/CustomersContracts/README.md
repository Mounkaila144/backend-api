# CustomersContracts Module

This module manages customer contracts in the multi-tenant Laravel application. It was migrated from the Symfony 1 legacy system while preserving the existing database schema.

## Overview

The CustomersContracts module handles the complete lifecycle of customer contracts, including:
- Contract creation and management
- Multiple status tracking (contract status, installation status, admin status)
- Team member assignments (telepro, sales, manager, assistant, installer)
- Product associations
- Financial tracking (prices with/without tax)
- Contract history and audit trail
- Multi-language status support (i18n)

## Database Structure

### Main Tables (Tenant Database)

All tables use the existing legacy schema with the `t_` prefix:

#### Core Tables

1. **`t_customers_contract`** - Main contracts table
   - Reference, customer, meeting, financial partner
   - Team members (telepro, sale_1, sale_2, manager, assistant, installer)
   - Multiple dates (opened_at, sent_at, payment_at, opc_at, apf_at)
   - Status fields (state_id, install_state_id, admin_status_id)
   - Financial data (total_price_with_taxe, total_price_without_taxe)
   - Additional: remarks, variables (JSON), is_signed

2. **`t_customers_contracts_status`** - Contract statuses
   - With translations: `t_customers_contracts_status_i18n`

3. **`t_customers_contracts_install_status`** - Installation statuses
   - With translations: `t_customers_contracts_install_status_i18n`

4. **`t_customers_contracts_admin_status`** - Admin statuses
   - With translations: `t_customers_contracts_admin_status_i18n`

5. **`t_customers_contract_product`** - Contract products (many-to-many)
   - Links contracts to products with details

6. **`t_customers_contracts_history`** - Audit trail
   - Tracks all changes with user_id and user_application (admin/superadmin)

7. **`t_customers_contracts_contributor`** - Contract contributors
   - Additional users with types and attributions

## Models (Eloquent)

All models are located in `Modules/CustomersContracts/Entities/`:

### Main Models

- **`CustomerContract.php`** - Main contract model
  - Relationships: customer, status, installStatus, adminStatus, products, history, contributors
  - Scopes: `active()`, `deleted()`, `signed()`
  - Accessors/Mutators for variables JSON handling

- **`CustomerContractStatus.php`** - Contract status with i18n support
- **`CustomerContractInstallStatus.php`** - Installation status with i18n support
- **`CustomerContractAdminStatus.php`** - Admin status with i18n support
- **`CustomerContractProduct.php`** - Contract product pivot
- **`CustomerContractHistory.php`** - History/audit log
- **`CustomerContractContributor.php`** - Contributors

### I18n Models

- `CustomerContractStatusI18n.php`
- `CustomerContractInstallStatusI18n.php`
- `CustomerContractAdminStatusI18n.php`

## API Endpoints

All endpoints require authentication (`auth:sanctum`) and tenant context.

Base URL: `/api/admin/customerscontracts/contracts`

### Contract Management

#### List contracts (with filters and pagination)
```
GET /api/admin/customerscontracts/contracts
```

**Query Parameters:**
- `reference` - Search by contract reference
- `customer_id` - Filter by customer ID
- `state_id` - Filter by status ID
- `install_state_id` - Filter by installation status
- `admin_status_id` - Filter by admin status
- `is_signed` - Filter by signature (YES/NO)
- `status` - Filter by active/delete (ACTIVE/DELETE, default: ACTIVE)
- `opened_at_from` / `opened_at_to` - Date range for opened_at
- `payment_at_from` / `payment_at_to` - Date range for payment_at
- `opc_at_from` / `opc_at_to` - Date range for opc_at
- `team_id` - Filter by team
- `telepro_id` / `sale_1_id` / `sale_2_id` - Filter by sales team
- `manager_id` / `assistant_id` / `installer_user_id` - Filter by staff
- `financial_partner_id` - Filter by financial partner
- `price_min` / `price_max` - Price range filter
- `remarks` - Search in remarks
- `per_page` - Items per page (default: 15)
- `page` - Page number
- `sort_by` - Sort field (default: created_at)
- `sort_order` - Sort direction (asc/desc, default: desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "contracts": [...]
  },
  "meta": {
    "current_page": 1,
    "last_page": 10,
    "per_page": 15,
    "total": 150
  }
}
```

#### Create contract
```
POST /api/admin/customerscontracts/contracts
```

**Required fields:**
- `reference` - Unique contract reference
- `customer_id` - Customer ID
- `financial_partner_id` - Financial partner ID
- `tax_id` - Tax ID
- `team_id` - Team ID
- `telepro_id` - Telepro user ID
- `sale_1_id` - Sale 1 user ID
- `manager_id` - Manager user ID
- `state_id` - Contract status ID
- `total_price_with_taxe` - Total with tax
- `total_price_without_taxe` - Total without tax

**Optional fields:**
- `meeting_id`, `sale_2_id`, `assistant_id`, `installer_user_id`
- `opened_at`, `sent_at`, `payment_at`, `opc_at`, `apf_at`
- `install_state_id`, `admin_status_id`
- `remarks`, `variables` (JSON), `is_signed`, `company_id`
- `products[]` - Array of products with `product_id` and `details`

#### Get contract details
```
GET /api/admin/customerscontracts/contracts/{id}
```

Returns contract with all relationships loaded.

#### Update contract
```
PUT /api/admin/customerscontracts/contracts/{id}
```

Same fields as create (all optional with `sometimes` validation).

#### Delete contract (soft delete)
```
DELETE /api/admin/customerscontracts/contracts/{id}
```

Marks contract as `status = 'DELETE'`.

#### Get contract statistics
```
GET /api/admin/customerscontracts/contracts/statistics
```

Returns:
- Total contracts (active)
- Total signed/unsigned
- Total revenue
- Breakdown by status
- Breakdown by install status
- Recent contracts (last 10)

#### Get contract history
```
GET /api/admin/customerscontracts/contracts/{id}/history
```

Returns audit trail for the contract.

## Repository Pattern

The `ContractRepository` class (`Repositories/ContractRepository.php`) encapsulates all business logic:

### Key Methods

- `getFilteredContracts($filters, $perPage)` - Main query builder with filters
- `find($id)` - Find by ID
- `findWithRelations($id)` - Find with eager loading
- `create($data)` - Create new contract
- `update($contract, $data)` - Update existing
- `softDelete($contract)` - Mark as DELETE
- `logHistory($contract, $message, $user)` - Add history entry
- `getHistory($contractId)` - Get audit trail
- `getStatistics()` - Get aggregate statistics
- `generateReference($prefix)` - Generate unique reference

## Resources (API Responses)

### `ContractResource`
Transforms contract model into JSON with:
- All contract fields
- Related customer (when loaded)
- Status objects with translations
- Products array
- History array
- Contributors array
- Formatted dates and prices

### `ContractCollection`
Wraps multiple contracts in a collection.

## Request Validation

### `StoreContractRequest`
Validates contract creation with:
- Required fields validation
- Unique reference check
- Foreign key existence checks
- Custom error messages

### `UpdateContractRequest`
Similar to store but with:
- `sometimes` rules (partial updates)
- Unique reference check excluding current contract

## Database Schema Evolution

The module preserves the complete schema evolution from Symfony 1:

### Version History

- **Base schema** - Initial 7 tables structure
- **v1.0** - Added `apf_at` date field
- **v1.3** - Added `assistant_id` field
- **v1.8** - Changed `opc_at` to DATETIME
- **v2.0** - Added installation status system
- **v2.5** - Made `meeting_id` nullable with foreign key
- **v3.0** - Added admin status system
- **v4.0** - Added `opened_at_range_id` field
- **v5.0** - Added `is_signed` field
- **v6.0** - Made `opc_range_id` nullable
- **v6.3** - Added `installer_user_id` field

See SQL files in `C:\xampp\htdocs\project\modules\customers_contracts\superadmin\updates\` for complete migration history.

## Dependencies

### Required Modules

- **Customer** - For customer relationship
- **UsersGuard** - For user relationships (telepro, sales, manager, etc.)
- **Products** (optional) - For product associations

### Required Tables in Tenant DB

- `t_customers`
- `t_customers_meeting`
- `t_users`
- `t_products`

## Usage Examples

### Create a contract

```php
$contract = CustomerContract::create([
    'reference' => 'CONT-2025-00001',
    'customer_id' => 123,
    'financial_partner_id' => 5,
    'tax_id' => 1,
    'team_id' => 10,
    'telepro_id' => 25,
    'sale_1_id' => 30,
    'manager_id' => 40,
    'state_id' => 1,
    'total_price_with_taxe' => 15000.00,
    'total_price_without_taxe' => 12500.00,
    'is_signed' => 'YES',
    'status' => 'ACTIVE',
]);
```

### Query with filters

```php
$contracts = CustomerContract::query()
    ->active()
    ->signed()
    ->where('state_id', 1)
    ->whereBetween('opened_at', ['2025-01-01', '2025-12-31'])
    ->with(['customer', 'status'])
    ->paginate(15);
```

### Get status translation

```php
$status = CustomerContractStatus::find(1);
$translatedValue = $status->getTranslatedValue('fr'); // French translation
```

### Log history

```php
$repository->logHistory(
    $contract,
    'Contract signed by customer',
    auth()->user()
);
```

## Important Notes

### Legacy Compatibility

- **DO NOT** modify existing table structures
- **DO NOT** rename columns
- All tables must remain compatible with Symfony 1 system
- Preserve `t_` prefix on all tables
- Respect existing foreign key constraints

### Multi-Tenancy

- All models use `'connection' => 'tenant'`
- Routes have `['auth:sanctum', 'tenant']` middleware
- Data is isolated per tenant automatically

### Soft Deletes

This module uses status-based soft deletes (`status = 'DELETE'`) instead of Laravel's soft delete trait to maintain compatibility with the legacy schema.

## Testing

Test the API endpoints with the `X-Tenant-ID` header:

```bash
curl -X GET "http://localhost/api/admin/customerscontracts/contracts" \
  -H "Authorization: Bearer {token}" \
  -H "X-Tenant-ID: 1"
```

## Future Enhancements

Potential improvements:
- Contract PDF generation
- Email notifications on status changes
- Contract renewal system
- Advanced reporting and analytics
- Integration with financial systems
- Signature workflow management

## Support

For issues or questions, refer to:
- Main project documentation: `CLAUDE.md`
- Multi-tenancy guide: `MULTI-TENANT-GUIDE.md`
- API testing scripts in project root
