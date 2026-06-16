# Component Registry

## Purpose

The component registry is required for Next.js dynamic routing because Webpack cannot resolve dynamic imports with template literals at build time.

All components that should be accessible via dynamic routes must be registered here.

## How to Register a New Component

### 1. Import the Component

```typescript
import YourComponent from '@/modules/YourModule/admin/components/YourComponent'
```

### 2. Add to Registry

For admin components, add to `adminComponentRegistry`:

```typescript
export const adminComponentRegistry: Record<string, ComponentType<any>> = {
  // ... existing entries
  'YourModule:YourComponent': YourComponent,
}
```

For superadmin components, add to `superadminComponentRegistry`:

```typescript
export const superadminComponentRegistry: Record<string, ComponentType<any>> = {
  // ... existing entries
  'YourModule:YourComponent': YourComponent,
}
```

### 3. URL Pattern

The component will be accessible at:
- Admin: `/{lang}/admin/YourModule/YourComponent`
- Superadmin: `/{lang}/superadmin/YourModule/YourComponent`

Where `{lang}` is `en`, `fr`, or `ar`.

## Examples

### Single-word Module and Component

```typescript
// Component path: src/modules/Dashboard/admin/components/Dashboard.tsx
'Dashboard:Dashboard': DashboardComponent,

// Accessible at: /en/admin/Dashboard/Dashboard
```

### Multi-word Module and Component

```typescript
// Component path: src/modules/CustomersContracts/admin/components/ContractsList1.tsx
'CustomersContracts:ContractsList1': ContractsList1,

// Accessible at: /en/admin/CustomersContracts/ContractsList1
```

## Important Notes

1. **Registry Key Format**: `'ModuleName:ComponentName'`
2. **Case Sensitivity**: Module and component names are case-sensitive
3. **Build Time**: Components must be imported at build time (no runtime dynamic imports)
4. **Export Type**: Components must have a default export

## Troubleshooting

### "Component not found" Error

1. Check that the component is imported at the top of `component-registry.ts`
2. Verify the registry key matches the URL pattern exactly
3. Ensure the component file exports a default export
4. Check for typos in module/component names (case-sensitive)

### Adding Many Components

For modules with many components, you can import them all at once:

```typescript
// Import all components from a module
import * as CustomersComponents from '@/modules/Customers/admin/components'

// Then register each one
export const adminComponentRegistry: Record<string, ComponentType<any>> = {
  'Customers:CustomersList': CustomersComponents.CustomersList,
  'Customers:CustomerDetail': CustomersComponents.CustomerDetail,
  'Customers:CustomerCreate': CustomersComponents.CustomerCreate,
  // ...
}
```
