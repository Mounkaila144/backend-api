# CustomersContracts Module

A comprehensive Next.js module for managing customer contracts in a multi-tenant SaaS application.

## 📁 Module Structure

```
src/modules/CustomersContracts/
├── admin/
│   ├── components/
│   │   ├── ContractsList1.tsx      # Main contracts list component
│   │   ├── ContractForm.tsx        # Create/Edit form component
│   │   └── ContractDetails.tsx     # Detailed contract view
│   ├── hooks/
│   │   ├── useContracts.ts         # Hook for contracts list management
│   │   ├── useContract.ts          # Hook for single contract management
│   │   └── useContractForm.ts      # Hook for form submission
│   └── services/
│       └── contractsService.ts     # API service layer
├── types/
│   └── index.ts                    # TypeScript type definitions
├── index.ts                        # Barrel export (public API)
└── README.md                       # This file
```

## 🚀 Quick Start

### Installation

The module is already integrated into the project. Simply import the components you need:

```typescript
import { ContractsList1, ContractForm, ContractDetails } from '@/src/modules/CustomersContracts';
```

### Basic Usage

#### 1. Display Contracts List

```typescript
'use client';

import { ContractsList1 } from '@/src/modules/CustomersContracts';

export default function ContractsPage() {
  return <ContractsList1 />;
}
```

#### 2. Create New Contract

```typescript
'use client';

import { ContractForm } from '@/src/modules/CustomersContracts';
import { useRouter } from 'next/navigation';

export default function CreateContractPage() {
  const router = useRouter();

  const handleSuccess = (contract) => {
    console.log('Contract created:', contract);
    router.push('/admin/contracts');
  };

  return (
    <ContractForm
      onSuccess={handleSuccess}
      onCancel={() => router.back()}
    />
  );
}
```

#### 3. View Contract Details

```typescript
'use client';

import { ContractDetails } from '@/src/modules/CustomersContracts';
import { useParams } from 'next/navigation';

export default function ContractDetailsPage() {
  const params = useParams();
  const contractId = Number(params.id);

  return <ContractDetails contractId={contractId} />;
}
```

#### 4. Edit Existing Contract

```typescript
'use client';

import { ContractForm, useContract } from '@/src/modules/CustomersContracts';
import { useParams, useRouter } from 'next/navigation';

export default function EditContractPage() {
  const params = useParams();
  const router = useRouter();
  const { contract, loading } = useContract(Number(params.id));

  if (loading) return <div>Loading...</div>;

  return (
    <ContractForm
      contract={contract}
      onSuccess={() => router.push('/admin/contracts')}
      onCancel={() => router.back()}
    />
  );
}
```

## 📊 API Endpoints

All endpoints require authentication and tenant context via headers:
- `Authorization: Bearer {token}`
- `X-Tenant-ID: {tenantId}`

### Contracts API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/customerscontracts/contracts` | List contracts (paginated) |
| POST | `/api/admin/customerscontracts/contracts` | Create new contract |
| GET | `/api/admin/customerscontracts/contracts/statistics` | Get statistics |
| GET | `/api/admin/customerscontracts/contracts/{id}` | Get single contract |
| PUT | `/api/admin/customerscontracts/contracts/{id}` | Update contract |
| DELETE | `/api/admin/customerscontracts/contracts/{id}` | Soft delete contract |
| GET | `/api/admin/customerscontracts/contracts/{id}/history` | Get contract history |

### Query Parameters (List Endpoint)

```typescript
{
  // Search & Basic Filters
  reference?: string;
  customer_id?: number;
  remarks?: string;

  // Status Filters
  state_id?: number;
  install_state_id?: number;
  admin_status_id?: number;
  is_signed?: 'YES' | 'NO';
  status?: 'ACTIVE' | 'DELETE';

  // Date Range Filters
  opened_at_from?: string;
  opened_at_to?: string;
  payment_at_from?: string;
  payment_at_to?: string;

  // Team & Staff Filters
  team_id?: number;
  sale_1_id?: number;
  manager_id?: number;

  // Financial Filters
  price_min?: number;
  price_max?: number;

  // Pagination & Sorting
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
  with_relations?: boolean;
}
```

## 🎯 Components

### ContractsList1 (List Component)

Main component for displaying contracts list with filtering, sorting, and pagination.

**Features:**
- Statistics cards (Total, Signed, Unsigned, Revenue)
- Advanced filtering (status, signed, date ranges, team, price)
- Sorting (reference, date, price, etc.)
- Pagination
- Search by reference
- Delete action with confirmation
- Responsive design

**Props:** None (uses internal hooks)

**Usage:**
```typescript
<ContractsList1 />
```

---

### ContractForm (Create/Edit Component)

Form component for creating new contracts or editing existing ones.

**Features:**
- Auto-detect create vs edit mode
- Generate unique reference
- Validation
- Error handling
- Loading states

**Props:**
```typescript
interface ContractFormProps {
  contract?: CustomerContract | null;  // For edit mode
  onSuccess?: (contract: CustomerContract) => void;
  onCancel?: () => void;
}
```

**Usage:**
```typescript
// Create mode
<ContractForm onSuccess={handleSuccess} onCancel={handleCancel} />

// Edit mode
<ContractForm contract={existingContract} onSuccess={handleSuccess} />
```

---

### ContractDetails (Detail View Component)

Comprehensive view of a single contract with all related data and history.

**Features:**
- Complete contract information
- Customer details
- Financial summary
- Product list
- Status badges with colors
- Change history timeline
- Edit and refresh actions

**Props:**
```typescript
interface ContractDetailsProps {
  contractId: number;
  onEdit?: (contract: CustomerContract) => void;
  onClose?: () => void;
}
```

**Usage:**
```typescript
<ContractDetails contractId={123} onEdit={handleEdit} onClose={handleClose} />
```

## 🪝 Custom Hooks

### useContracts

Manages contracts list with filtering, pagination, and CRUD operations.

**Returns:**
```typescript
{
  // Data
  contracts: CustomerContract[];
  stats: ContractStatsResponse['data'] | null;

  // Loading & Error
  loading: boolean;
  error: string | null;

  // Pagination
  currentPage: number;
  totalPages: number;
  total: number;
  perPage: number;
  filters: ContractFilters;

  // Actions
  setCurrentPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  setFilters: (filters: ContractFilters) => void;
  updateFilter: (key, value) => void;
  clearFilters: () => void;
  refreshContracts: () => Promise<void>;
  deleteContract: (id: number) => Promise<boolean>;
}
```

**Usage:**
```typescript
const {
  contracts,
  stats,
  loading,
  error,
  currentPage,
  setCurrentPage,
  updateFilter,
  deleteContract
} = useContracts();
```

---

### useContract

Manages a single contract with details, history, and updates.

**Returns:**
```typescript
{
  // Data
  contract: CustomerContract | null;
  history: ContractHistory[];

  // Loading & Error
  loading: boolean;
  error: string | null;
  historyLoading: boolean;

  // Actions
  refreshContract: () => Promise<void>;
  updateContract: (data: UpdateContractData) => Promise<boolean>;
  loadHistory: () => Promise<void>;
}
```

**Usage:**
```typescript
const { contract, history, loading, updateContract } = useContract(contractId);
```

---

### useContractForm

Handles form submission for creating and updating contracts.

**Returns:**
```typescript
{
  // Loading & Error
  submitting: boolean;
  error: string | null;

  // Actions
  createContract: (data: CreateContractData) => Promise<CustomerContract | null>;
  updateContract: (id: number, data: UpdateContractData) => Promise<CustomerContract | null>;
  generateReference: (prefix?: string) => Promise<string | null>;
  clearError: () => void;
}
```

**Usage:**
```typescript
const { submitting, error, createContract, generateReference } = useContractForm();

const handleSubmit = async (formData) => {
  const contract = await createContract(formData);
  if (contract) {
    console.log('Success:', contract);
  }
};
```

## 🔧 Services

### contractsService

Service layer for all contract-related API calls.

**Methods:**

```typescript
// List contracts with filters
getContracts(filters?: ContractFilters): Promise<ContractListResponse>

// Get single contract
getContract(id: number): Promise<ContractDetailResponse>

// Get statistics
getStatistics(): Promise<ContractStatsResponse>

// Get contract history
getContractHistory(id: number): Promise<ContractHistoryResponse>

// Create contract
createContract(data: CreateContractData): Promise<ContractDetailResponse>

// Update contract
updateContract(id: number, data: UpdateContractData): Promise<ContractDetailResponse>

// Delete contract (soft delete)
deleteContract(id: number): Promise<{ success: boolean; message: string }>

// Generate unique reference
generateReference(prefix?: string): Promise<{ success: boolean; reference: string }>
```

**Direct Usage:**
```typescript
import { contractsService } from '@/src/modules/CustomersContracts';

const contracts = await contractsService.getContracts({ status: 'ACTIVE' });
const contract = await contractsService.getContract(123);
```

## 📝 TypeScript Types

### Core Entity Types

- `CustomerContract` - Main contract entity
- `ContractStatus` - Contract status entity
- `ContractAdminStatus` - Admin status entity
- `ContractInstallStatus` - Installation status entity
- `ContractProduct` - Contract product relation
- `ContractContributor` - Contract contributor relation
- `ContractHistory` - Change history entry

### API Response Types

- `ContractListResponse` - List response with pagination
- `ContractDetailResponse` - Single contract response
- `ContractStatsResponse` - Statistics response
- `ContractHistoryResponse` - History list response

### Filter & Form Types

- `ContractFilters` - Query filters for list endpoint
- `CreateContractData` - Data for creating contract
- `UpdateContractData` - Data for updating contract

### Utility Types

- `ContractSortField` - Valid sort field names
- `ContractStatusType` - 'ACTIVE' | 'DELETE'
- `ContractSignedType` - 'YES' | 'NO'
- `ContractUserApplication` - 'admin' | 'superadmin'

## 🎨 Styling

All components use inline React.CSSProperties for styling to maintain consistency with the project's pattern. Key design features:

- **Colors:** Gradient primary (#667eea, #764ba2), semantic colors for states
- **Typography:** Responsive font sizes, gradient titles
- **Layout:** Flexbox and CSS Grid for responsive design
- **Components:** Cards, badges, buttons with hover effects
- **States:** Loading spinners, error messages, empty states

## 🔐 Authentication & Authorization

All API calls automatically include:
- **Bearer Token:** From localStorage (`auth_token`)
- **Tenant Context:** Domain-based or explicit tenant ID

Handled by the shared `apiClient` from `@/shared/lib/api-client`.

## 🌍 Multi-Tenancy

The module is tenant-aware via the shared API client. No explicit tenant management needed in components.

## 🧪 Testing

To test the module:

1. **Backend Running:** Ensure Laravel backend is running on `http://localhost:8000`
2. **Frontend Running:** Ensure Next.js frontend is running on `http://localhost:3000`
3. **Authentication:** Login as a tenant user
4. **Navigate:** Go to `/admin/customerscontracts/contracts`

## 📋 Database Tables

**Tenant Database:**
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

## 🚧 Future Enhancements

- [ ] Bulk operations (multi-select, bulk delete)
- [ ] Export to CSV/Excel
- [ ] Advanced filters UI (date picker, multi-select)
- [ ] Contract templates
- [ ] Document attachments
- [ ] Email notifications
- [ ] Print/PDF generation
- [ ] Activity feed
- [ ] Search by customer name/email

## 📚 Related Documentation

- **Project Root:** `/CLAUDE.md` - Architecture overview
- **Customers Module:** `/src/modules/Customers/README.md` - Similar module example
- **Dynamic Routing:** `/DYNAMIC-ROUTING.md` - Routing system
- **Backend Module:** `C:\laragon\www\backend-api\Modules\CustomersContracts\` - Laravel backend

## 🤝 Contributing

When extending this module:

1. Follow the existing patterns (hooks → services → API)
2. Update TypeScript types in `types/index.ts`
3. Export new components/hooks through `index.ts`
4. Update this README with new features
5. Test thoroughly with the backend API

## 📞 Support

For issues or questions:
- Check backend logs: `C:\laragon\www\backend-api\storage\logs\laravel.log`
- Check browser console for frontend errors
- Verify API endpoints with Postman/Insomnia
- Review Laravel routes: `php artisan route:list --path=customerscontracts`

---

**Version:** 1.0.0
**Last Updated:** 2024
**Author:** Generated by Claude Code
**License:** Private - Internal Use Only
