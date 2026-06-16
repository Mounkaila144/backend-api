# Modules Documentation

This directory contains the modular architecture for the Next.js application, mirroring the Laravel backend structure.

## Structure Overview

Each module follows a consistent structure with three layers: **Admin**, **Superadmin**, and **Frontend**.

```
modules/
└── ModuleName/
    ├── admin/              # Tenant-specific admin functionality
    │   ├── components/     # React components
    │   ├── hooks/          # Custom React hooks
    │   ├── services/       # API service functions
    │   └── utils/          # Utility functions
    ├── superadmin/         # Central admin functionality
    │   ├── components/
    │   ├── hooks/
    │   ├── services/
    │   └── utils/
    ├── frontend/           # Public/user-facing functionality
    │   ├── components/
    │   ├── hooks/
    │   ├── services/
    │   └── utils/
    ├── types/              # Shared TypeScript types
    │   └── *.types.ts
    └── index.ts            # Barrel export (public API)
```

## Existing Modules

### UsersGuard

Authentication and user management module.

**Admin Layer:**
- Login functionality for tenant admin users
- User authentication with JWT tokens
- Multi-tenant support via `X-Tenant-ID` header

**Exports:**
```typescript
import {
  LoginForm,           // Login form component
  useAuth,             // Authentication hook
  adminAuthService,    // Auth service functions
  User,                // User type
  LoginCredentials,    // Login credentials type
} from '@/src/modules/UsersGuard';
```

**Usage Example:**
```typescript
// In a page component
import { LoginForm } from '@/src/modules/UsersGuard';

export default function LoginPage() {
  return <LoginForm />;
}

// Using the auth hook
import { useAuth } from '@/src/modules/UsersGuard';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) return <div>Please login</div>;

  return (
    <div>
      <p>Welcome {user?.user_login}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Creating a New Module

### 1. Directory Structure

Create the following structure:

```bash
mkdir -p src/modules/YourModule/{admin,superadmin,frontend}/{components,hooks,services,utils}
mkdir src/modules/YourModule/types
```

### 2. Create Types

Create `types/yourmodule.types.ts`:

```typescript
export interface YourType {
  id: number;
  name: string;
}
```

### 3. Create Service

Create `admin/services/yourService.ts`:

```typescript
import { createApiClient } from '@/shared/lib/api-client';

class YourService {
  async getData(tenantId?: string) {
    const client = createApiClient(tenantId);
    const response = await client.get('/admin/your-endpoint');
    return response.data;
  }
}

export const yourService = new YourService();
```

### 4. Create Hook

Create `admin/hooks/useYourHook.ts`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/shared/lib/tenant-context';
import { yourService } from '../services/yourService';

export const useYourHook = () => {
  const { tenantId } = useTenant();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await yourService.getData(tenantId || undefined);
        setData(result);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tenantId]);

  return { data, loading };
};
```

### 5. Create Components

Create `admin/components/YourComponent.tsx`:

```typescript
'use client';

import { useYourHook } from '../hooks/useYourHook';

export default function YourComponent() {
  const { data, loading } = useYourHook();

  if (loading) return <div>Loading...</div>;

  return <div>{/* Your component JSX */}</div>;
}
```

### 6. Create Barrel Export

Create `index.ts`:

```typescript
// Admin exports
export { default as YourComponent } from './admin/components/YourComponent';
export { useYourHook } from './admin/hooks/useYourHook';
export { yourService } from './admin/services/yourService';

// Types
export type { YourType } from './types/yourmodule.types';
```

## Multi-Tenancy Support

All modules support multi-tenancy through:

1. **Tenant Context**: Use `useTenant()` hook to access `tenantId` and `domain`
2. **API Client**: Pass `tenantId` to `createApiClient()` to automatically add `X-Tenant-ID` header
3. **Local Storage**: Tenant info is persisted in localStorage

### Example:

```typescript
import { useTenant } from '@/shared/lib/tenant-context';
import { createApiClient } from '@/shared/lib/api-client';

function MyComponent() {
  const { tenantId, setTenantId } = useTenant();

  const handleApiCall = async () => {
    const client = createApiClient(tenantId || undefined);
    const response = await client.get('/admin/data');
  };
}
```

## Layer Separation

### Admin Layer
- Uses tenant database
- Requires authentication (`auth:sanctum` + `tenant` middleware)
- API endpoints: `/api/admin/*`
- Pages: `/admin/*`

### Superadmin Layer
- Uses central database
- Requires authentication (`auth:sanctum` only)
- API endpoints: `/api/superadmin/*`
- Pages: `/superadmin/*`

### Frontend Layer
- Uses tenant database
- Public and authenticated routes
- API endpoints: `/api/frontend/*` or `/frontend/*`
- Pages: `/*` (public pages)

## Best Practices

1. **Always use barrel exports** (`index.ts`) to expose module's public API
2. **Keep layers separate** - don't mix admin/superadmin/frontend code
3. **Use TypeScript** - define types in the `types/` directory
4. **Client components** - Mark interactive components with `'use client'`
5. **Error handling** - Always handle errors in services and hooks
6. **Loading states** - Provide loading states in hooks and components

## API Integration

All API calls should use the shared API client:

```typescript
import { createApiClient } from '@/shared/lib/api-client';

// With tenant
const client = createApiClient(tenantId);

// Without tenant (superadmin)
const client = createApiClient();
```

The API client automatically:
- Adds authentication token from localStorage
- Adds `X-Tenant-ID` header if provided
- Handles 401 errors (redirects to login)
- Uses base URL from `NEXT_PUBLIC_API_URL` environment variable

## Environment Variables

Required in `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```
