# Test script for Users List API
# This script tests the GET /api/admin/users endpoint with all features

$baseUrl = "http://localhost:8000"
$tenantId = "1"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Users List API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Get users list (default pagination)
Write-Host "Test 1: Get users list (default pagination)" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/users" `
        -Method GET `
        -Headers @{
            "X-Tenant-ID" = $tenantId
            "Accept" = "application/json"
        }

    Write-Host "SUCCESS: Retrieved users list" -ForegroundColor Green
    Write-Host "Total users: $($response.meta.total)" -ForegroundColor White
    Write-Host "Current page: $($response.meta.current_page)/$($response.meta.last_page)" -ForegroundColor White
    Write-Host "Per page: $($response.meta.per_page)" -ForegroundColor White
    Write-Host ""

    # Display first user details
    if ($response.data.Count -gt 0) {
        $firstUser = $response.data[0]
        Write-Host "First user details:" -ForegroundColor Cyan
        Write-Host "  ID: $($firstUser.id)" -ForegroundColor White
        Write-Host "  Username: $($firstUser.username)" -ForegroundColor White
        Write-Host "  Full name: $($firstUser.full_name)" -ForegroundColor White
        Write-Host "  Email: $($firstUser.email)" -ForegroundColor White
        Write-Host "  Is Active: $($firstUser.is_active)" -ForegroundColor White
        Write-Host "  Status: $($firstUser.status)" -ForegroundColor White
        Write-Host "  Groups: $($firstUser.groups_list)" -ForegroundColor White
        Write-Host "  Teams: $($firstUser.teams_list)" -ForegroundColor White
        Write-Host "  Functions: $($firstUser.functions_list)" -ForegroundColor White
        Write-Host "  Profiles: $($firstUser.profiles_list)" -ForegroundColor White
        Write-Host "  Created at: $($firstUser.created_at)" -ForegroundColor White
        Write-Host "  Last login: $($firstUser.lastlogin)" -ForegroundColor White

        if ($firstUser.callcenter) {
            Write-Host "  Callcenter: $($firstUser.callcenter.name)" -ForegroundColor White
        }

        if ($firstUser.creator) {
            Write-Host "  Creator: $($firstUser.creator.full_name)" -ForegroundColor White
        }
    }
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Get users with custom pagination
Write-Host "Test 2: Get users with custom pagination (10 per page)" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/users?nbitemsbypage=10" `
        -Method GET `
        -Headers @{
            "X-Tenant-ID" = $tenantId
            "Accept" = "application/json"
        }

    Write-Host "SUCCESS: Retrieved $($response.data.Count) users" -ForegroundColor Green
    Write-Host "Per page: $($response.meta.per_page)" -ForegroundColor White
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Search users by username
Write-Host "Test 3: Search users by username" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
try {
    $body = @{
        filter = @{
            search = @{
                username = "admin"
            }
        }
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/users" `
        -Method GET `
        -Headers @{
            "X-Tenant-ID" = $tenantId
            "Accept" = "application/json"
            "Content-Type" = "application/json"
        } `
        -Body $body

    Write-Host "SUCCESS: Found $($response.data.Count) users matching 'admin'" -ForegroundColor Green
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Sort users by created_at DESC
Write-Host "Test 4: Sort users by created_at DESC" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
try {
    $body = @{
        filter = @{
            order = @{
                created_at = "desc"
            }
        }
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/users" `
        -Method GET `
        -Headers @{
            "X-Tenant-ID" = $tenantId
            "Accept" = "application/json"
            "Content-Type" = "application/json"
        } `
        -Body $body

    Write-Host "SUCCESS: Retrieved users sorted by created_at DESC" -ForegroundColor Green
    if ($response.data.Count -gt 0) {
        Write-Host "  Newest user: $($response.data[0].username) (Created: $($response.data[0].created_at))" -ForegroundColor White
    }
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Filter active users
Write-Host "Test 5: Filter active users" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
try {
    $body = @{
        filter = @{
            equal = @{
                is_active = "YES"
            }
        }
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/users" `
        -Method GET `
        -Headers @{
            "X-Tenant-ID" = $tenantId
            "Accept" = "application/json"
            "Content-Type" = "application/json"
        } `
        -Body $body

    Write-Host "SUCCESS: Found $($response.meta.total) active users" -ForegroundColor Green
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6: Get statistics
Write-Host "Test 6: Get user statistics" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/users/statistics" `
        -Method GET `
        -Headers @{
            "X-Tenant-ID" = $tenantId
            "Accept" = "application/json"
        }

    Write-Host "SUCCESS: Retrieved user statistics" -ForegroundColor Green
    Write-Host "  Total users: $($response.data.total)" -ForegroundColor White
    Write-Host "  Active users: $($response.data.active)" -ForegroundColor White
    Write-Host "  Inactive users: $($response.data.inactive)" -ForegroundColor White
    Write-Host "  Locked users: $($response.data.locked)" -ForegroundColor White
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All tests completed!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
