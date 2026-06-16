# Customers Module

## Overview
The Customers module provides a complete customer management system with listing, filtering, search, and CRUD operations.

## Route
**URL:** `http://tenant1.local/admin/customers/customers`

This route is automatically generated from the `system_menu` table entry:
- `module`: `customers`
- `name`: `0000_customers`

## Features
- ✅ Paginated customer list
- ✅ Search by name, email, phone
- ✅ Filter by status (Active/Deleted)
- ✅ Sort by multiple fields
- ✅ Customer statistics dashboard
- ✅ Delete customers (soft delete)
- ✅ Responsive design

## API Endpoints
All endpoints are under `/api/admin/customers` and require authentication.

### GET /api/admin/customers
Get paginated list of customers

**Query Parameters:**
- `search` (optional): Search term
- `status` (optional): ACTIVE | DELETE (default: ACTIVE)
- `sort_by` (optional): Field to sort by (default: created_at)
- `sort_order` (optional): asc | desc (default: desc)
- `per_page` (optional): Results per page (default: 15)
- `page` (optional): Page number (default: 1)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "company": "ACME Corp",
      "display_name": "Mr John Doe",
      "email": "john@example.com",
      "phone": "+33123456789",
      "mobile": "+33612345678",
      "primary_address": {
        "city": "Paris",
        "postcode": "75001"
      },
      "created_at": "2024-01-01T10:00:00"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 10,
    "per_page": 15,
    "total": 150
  }
}
```

### GET /api/admin/customers/stats
Get customer statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "total_customers": 150,
    "total_deleted": 5,
    "with_company": 120,
    "with_email": 145,
    "with_mobile": 140
  }
}
```

### GET /api/admin/customers/{id}
Get single customer details with all relations

### POST /api/admin/customers
Create a new customer

### PUT /api/admin/customers/{id}
Update a customer

### DELETE /api/admin/customers/{id}
Soft delete a customer (sets status to DELETE)

## File Structure
```
src/modules/Customers/
├── admin/
│   ├── components/
│   │   └── Customers.tsx          # Main customer list component
│   ├── services/
│   │   └── customersService.ts    # API service layer
│   └── hooks/                     # Custom React hooks (future)
├── types/
│   └── index.ts                   # TypeScript types
├── index.ts                       # Module exports
└── README.md                      # This file
```

## Backend Models
Located in Laravel: `C:\laragon\www\backend-api\Modules\Customer\Entities\`

- `Customer.php` - Main customer model
- `CustomerAddress.php` - Customer addresses
- `CustomerContact.php` - Customer contacts
- `CustomerHouse.php` - House information
- `CustomerFinancial.php` - Financial data
- `CustomerUnion.php` - Customer unions

## Database Setup

### Add Menu Entry
Run the SQL script to add the menu entry:
```bash
mysql -u root -p database_name < C:\laragon\www\backend-api\database\sql\add_customers_menu.sql
```

Or manually insert:
```sql
INSERT INTO system_menu (name, module, menu, lb, rb, level, status, type, translation)
VALUES ('0000_customers', 'customers', '', 100, 101, 2, 'ACTIVE', 'SYSTEM', 'Customers List');
```

### Customer Tables
The backend uses existing tables from Symfony migration:
- `t_customers` - Main customer data
- `t_customers_address` - Customer addresses
- `t_customers_contact` - Additional contacts
- `t_customers_house` - House information
- `t_customers_financial` - Financial data
- `t_customers_union` - Customer unions
- `t_customers_sector` - Sectors
- `t_customers_sector_dept` - Sector departments

## Usage

### Basic Usage
The component is automatically loaded when navigating to `/admin/customers/customers`.

No manual route configuration needed - the dynamic routing system handles it.

### Customization
To modify the component:
1. Edit `src/modules/Customers/admin/components/Customers.tsx`
2. Changes are hot-reloaded in development

To add new API endpoints:
1. Add to `src/modules/Customers/admin/services/customersService.ts`
2. Update types in `src/modules/Customers/types/index.ts`

## Testing
1. Ensure backend API is running (`php artisan serve`)
2. Ensure frontend is running (`npm run dev`)
3. Login to admin panel
4. Click on "Customers List" in the sidebar
5. Should navigate to: `http://tenant1.local/admin/customers/customers`

## Troubleshooting

### "Module Not Found" Error
Ensure:
- File exists at: `src/modules/Customers/admin/components/Customers.tsx`
- File has default export: `export default function Customers() { ... }`
- File name matches exactly (case-sensitive): `Customers.tsx`

### Menu Not Appearing
Check:
- Menu entry exists in `system_menu` table
- `status` = 'ACTIVE'
- `level` > 0 (level 0 is root, not displayed)

### API Errors
Check:
- Backend is running
- Tenant header is set correctly
- User is authenticated
- API routes are registered in Laravel

## Future Enhancements
- [ ] Add customer creation form
- [ ] Add customer edit form
- [ ] Add export to CSV/Excel
- [ ] Add bulk operations
- [ ] Add customer details modal
- [ ] Add customer activity timeline
- [ ] Add customer notes/comments