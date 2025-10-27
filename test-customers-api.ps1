# PowerShell script to test Customers API
# Run with: powershell -ExecutionPolicy Bypass -File test-customers-api.ps1

$BaseUrl = "http://localhost:8000/api/admin/customers"
$TenantId = "1"  # Change to your tenant ID
$Token = "YOUR_SANCTUM_TOKEN_HERE"  # Replace with actual token after login

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Testing Customers API" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Headers
$headers = @{
    "Accept" = "application/json"
    "Content-Type" = "application/json"
    "X-Tenant-ID" = $TenantId
    "Authorization" = "Bearer $Token"
}

# Test 1: Get customer statistics
Write-Host "Test 1: Getting customer statistics..." -ForegroundColor Yellow
Write-Host "GET ${BaseUrl}/stats" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "${BaseUrl}/stats" -Method GET -Headers $headers
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Test 2: Get list of customers
Write-Host "Test 2: Getting list of customers..." -ForegroundColor Yellow
Write-Host "GET ${BaseUrl}?per_page=5&page=1" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "${BaseUrl}?per_page=5&page=1" -Method GET -Headers $headers
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Test 3: Search customers
Write-Host "Test 3: Searching customers..." -ForegroundColor Yellow
Write-Host "GET ${BaseUrl}?search=test&per_page=5" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "${BaseUrl}?search=test&per_page=5" -Method GET -Headers $headers
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Test 4: Get customer by ID
$CustomerId = 1  # Change to an existing customer ID
Write-Host "Test 4: Getting customer details (ID: ${CustomerId})..." -ForegroundColor Yellow
Write-Host "GET ${BaseUrl}/${CustomerId}" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "${BaseUrl}/${CustomerId}" -Method GET -Headers $headers
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Test 5: Create a new customer
Write-Host "Test 5: Creating a new customer..." -ForegroundColor Yellow
Write-Host "POST ${BaseUrl}" -ForegroundColor Gray
$newCustomer = @{
    company = "Test Company"
    gender = "Mr"
    firstname = "John"
    lastname = "Doe"
    email = "john.doe@test.com"
    phone = "+33123456789"
    mobile = "+33612345678"
    occupation = "Developer"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $BaseUrl -Method POST -Headers $headers -Body $newCustomer
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Note: Make sure to:" -ForegroundColor Yellow
Write-Host "1. Replace `$TenantId with your actual tenant ID" -ForegroundColor Yellow
Write-Host "2. Replace `$Token with your actual Sanctum token" -ForegroundColor Yellow
Write-Host "3. Adjust `$CustomerId for test 4 to an existing customer" -ForegroundColor Yellow
