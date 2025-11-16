# User API Documentation

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [List Users](#list-users)
  - [Get User](#get-user)
  - [Create User](#create-user)
  - [Update User](#update-user)
  - [Delete User](#delete-user)
  - [User Statistics](#user-statistics)
- [Response Format](#response-format)
- [Filters and Sorting](#filters-and-sorting)
- [Examples](#examples)

## Overview

The User API provides endpoints to manage users in the tenant database. All endpoints require authentication via Sanctum and tenant context.

**Base URL:** `/api/admin/users`

## Authentication

All endpoints require:
- `X-Tenant-ID` header with the tenant identifier
- `Authorization: Bearer {token}` header with a valid Sanctum token

## Endpoints

### List Users

Get a paginated list of users with all their information.

**Endpoint:** `GET /api/admin/users`

**Query Parameters:**
- `nbitemsbypage` (optional, default: 100) - Number of items per page. Use `*` for all items.

**Request Body (optional):**
```json
{
  "filter": {
    "search": {
      "query": "search text",
      "username": "username to search",
      "firstname": "firstname to search",
      "lastname": "lastname to search",
      "email": "email to search",
      "id": 123
    },
    "equal": {
      "is_active": "YES",
      "status": "ACTIVE",
      "is_locked": "NO",
      "is_secure_by_code": "NO",
      "group_id": 1,
      "creator_id": 1,
      "unlocked_by": 1,
      "company_id": 1,
      "callcenter_id": 1
    },
    "order": {
      "username": "asc",
      "created_at": "desc",
      "lastlogin": "desc"
    },
    "range": {
      "created_at_from": "2024-01-01",
      "created_at_to": "2024-12-31",
      "lastlogin_from": "2024-01-01",
      "lastlogin_to": "2024-12-31"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "john.doe",
      "firstname": "John",
      "lastname": "Doe",
      "full_name": "John Doe",
      "email": "john.doe@example.com",
      "sex": "Mr",
      "phone": "+1234567890",
      "mobile": "+1234567890",
      "birthday": "1990-01-01",
      "picture": "",
      "application": "admin",
      "is_active": "YES",
      "is_guess": "NO",
      "is_locked": "NO",
      "locked_at": null,
      "is_secure_by_code": "NO",
      "status": "ACTIVE",
      "number_of_try": 0,
      "last_password_gen": "2024-01-01T00:00:00+00:00",
      "lastlogin": "2024-01-15T10:30:00+00:00",
      "created_at": "2024-01-01T00:00:00+00:00",
      "updated_at": "2024-01-15T10:30:00+00:00",
      "groups_list": "admin,manager",
      "teams_list": "Team A,Team B",
      "functions_list": "Administrator,Manager",
      "profiles": "Admin Profile",
      "groups": [
        {
          "id": 1,
          "name": "admin",
          "permissions": ["users.view", "users.edit"]
        }
      ],
      "teams": [
        {
          "id": 1,
          "name": "Team A"
        }
      ],
      "functions": [
        {
          "id": 1,
          "name": "Administrator"
        }
      ],
      "profiles": [
        {
          "id": 1,
          "name": "Admin Profile"
        }
      ],
      "attributions": [
        {
          "id": 1,
          "name": "Sales"
        }
      ],
      "team": {
        "id": 1,
        "name": "Team A",
        "manager_id": 5
      },
      "managers": [
        {
          "id": 5,
          "username": "manager",
          "full_name": "Manager User"
        }
      ],
      "managed_teams": [],
      "creator": {
        "id": 1,
        "username": "admin",
        "full_name": "Admin User"
      },
      "unlocker": null,
      "callcenter": {
        "id": 1,
        "name": "Main Callcenter"
      },
      "company_id": null,
      "callcenter_id": 1,
      "team_id": 1,
      "creator_id": 1,
      "unlocked_by": null
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 100,
    "total": 450,
    "from": 1,
    "to": 100
  },
  "statistics": {
    "total": 450,
    "active": 420,
    "inactive": 30,
    "locked": 5
  },
  "tenant": {
    "id": 1,
    "host": "example.com"
  }
}
```

### Get User

Get a single user by ID with all relations.

**Endpoint:** `GET /api/admin/users/{id}`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "john.doe",
    // ... same structure as list response
  }
}
```

### Create User

Create a new user.

**Endpoint:** `POST /api/admin/users`

**Request Body:**
```json
{
  "username": "john.doe",
  "password": "secure_password",
  "email": "john.doe@example.com",
  "firstname": "John",
  "lastname": "Doe",
  "sex": "MR",
  "phone": "+1234567890",
  "mobile": "+1234567890",
  "birthday": "1990-01-01",
  "is_active": "YES",
  "application": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 1,
    "username": "john.doe",
    // ... full user data
  }
}
```

### Update User

Update an existing user.

**Endpoint:** `PUT /api/admin/users/{id}` or `PATCH /api/admin/users/{id}`

**Request Body:**
```json
{
  "firstname": "John Updated",
  "lastname": "Doe Updated",
  "email": "john.updated@example.com",
  "is_active": "NO",
  "is_locked": "YES"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": 1,
    "username": "john.doe",
    // ... full user data
  }
}
```

### Delete User

Soft delete a user (sets status to DELETE).

**Endpoint:** `DELETE /api/admin/users/{id}`

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### User Statistics

Get user statistics.

**Endpoint:** `GET /api/admin/users/statistics`

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 450,
    "active": 420,
    "inactive": 30,
    "locked": 5
  }
}
```

## Response Format

All responses follow this structure:

### Success Response
```json
{
  "success": true,
  "data": { /* resource data */ },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "field_name": ["Validation error message"]
  }
}
```

## Filters and Sorting

### Search Filters

Search filters allow you to search across multiple fields:

```json
{
  "filter": {
    "search": {
      "query": "john",           // Searches in username, firstname, lastname, email
      "username": "john",         // Specific username search
      "firstname": "John",        // Specific firstname search
      "lastname": "Doe",          // Specific lastname search
      "email": "john@example.com" // Specific email search
    }
  }
}
```

### Equal Filters

Equal filters allow exact matching:

```json
{
  "filter": {
    "equal": {
      "is_active": "YES",        // Filter by active status
      "status": "ACTIVE",         // Filter by status
      "is_locked": "NO",          // Filter by locked status
      "group_id": 1,              // Filter by group
      "creator_id": 1,            // Filter by creator
      "callcenter_id": 1          // Filter by callcenter
    }
  }
}
```

### Sorting

You can sort by multiple fields:

```json
{
  "filter": {
    "order": {
      "username": "asc",
      "created_at": "desc",
      "lastlogin": "desc",
      "firstname": "asc",
      "lastname": "asc",
      "email": "asc",
      "last_password_gen": "desc"
    }
  }
}
```

### Date Range Filters

Filter by date ranges:

```json
{
  "filter": {
    "range": {
      "created_at_from": "2024-01-01",
      "created_at_to": "2024-12-31",
      "lastlogin_from": "2024-01-01",
      "lastlogin_to": "2024-12-31"
    }
  }
}
```

## Examples

### Example 1: Get all active users sorted by username

```bash
curl -X GET "http://localhost:8000/api/admin/users" \
  -H "X-Tenant-ID: 1" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "equal": {
        "is_active": "YES"
      },
      "order": {
        "username": "asc"
      }
    }
  }'
```

### Example 2: Search users by email domain

```bash
curl -X GET "http://localhost:8000/api/admin/users" \
  -H "X-Tenant-ID: 1" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "search": {
        "email": "@example.com"
      }
    }
  }'
```

### Example 3: Get recently created users (last 30 days)

```bash
curl -X GET "http://localhost:8000/api/admin/users" \
  -H "X-Tenant-ID: 1" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "range": {
        "created_at_from": "2024-01-01"
      },
      "order": {
        "created_at": "desc"
      }
    }
  }'
```

### Example 4: Get users in a specific group

```bash
curl -X GET "http://localhost:8000/api/admin/users" \
  -H "X-Tenant-ID: 1" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "equal": {
        "group_id": 1
      }
    }
  }'
```

### Example 5: Get locked users

```bash
curl -X GET "http://localhost:8000/api/admin/users" \
  -H "X-Tenant-ID: 1" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "equal": {
        "is_locked": "YES"
      }
    }
  }'
```

## User Data Fields

### Basic Information
- `id` - User ID
- `username` - Username (unique per application)
- `firstname` - First name
- `lastname` - Last name
- `full_name` - Full name (computed)
- `email` - Email address
- `sex` - Sex (Mr, Ms, Mrs)
- `phone` - Phone number
- `mobile` - Mobile number
- `birthday` - Birth date
- `picture` - Profile picture path
- `application` - Application context (admin, frontend)

### Status Fields
- `is_active` - Active status (YES/NO)
- `is_guess` - Guest status (YES/NO)
- `is_locked` - Locked status (YES/NO)
- `locked_at` - When user was locked
- `is_secure_by_code` - Two-factor authentication (YES/NO)
- `status` - User status (ACTIVE/DELETE)
- `number_of_try` - Number of login attempts

### Date Fields
- `last_password_gen` - Last password generation date
- `lastlogin` - Last login date
- `created_at` - Creation date
- `updated_at` - Last update date

### Relations
- `groups` - User groups with permissions
- `teams` - User teams
- `functions` - User functions/roles
- `profiles` - User profiles
- `attributions` - User attributions
- `team` - Direct team (via team_id)
- `managers` - Users who manage this user
- `managed_teams` - Teams managed by this user
- `creator` - User who created this user
- `unlocker` - User who unlocked this user
- `callcenter` - User's callcenter

### Aggregated Lists (for display)
- `groups_list` - Comma-separated list of group names
- `teams_list` - Comma-separated list of team names
- `functions_list` - Comma-separated list of function names
- `profiles_list` - Comma-separated list of profile names

## Testing

A PowerShell test script is available at `test-users-list-api.ps1` to test all endpoints.

To run the test:
```powershell
.\test-users-list-api.ps1
```
