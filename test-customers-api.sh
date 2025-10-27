#!/bin/bash

# Test script for Customers API
# This script tests all the customer endpoints

BASE_URL="http://localhost:8000/api/admin/customers"
TENANT_ID="1"  # Change to your tenant ID
TOKEN="YOUR_SANCTUM_TOKEN_HERE"  # Replace with actual token after login

echo "================================================"
echo "Testing Customers API"
echo "================================================"
echo ""

# Test 1: Get customer statistics
echo "Test 1: Getting customer statistics..."
echo "GET ${BASE_URL}/stats"
curl -X GET "${BASE_URL}/stats" \
  -H "Accept: application/json" \
  -H "X-Tenant-ID: ${TENANT_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  | json_pp
echo ""
echo "================================================"
echo ""

# Test 2: Get list of customers (first page)
echo "Test 2: Getting list of customers..."
echo "GET ${BASE_URL}"
curl -X GET "${BASE_URL}?per_page=5&page=1" \
  -H "Accept: application/json" \
  -H "X-Tenant-ID: ${TENANT_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  | json_pp
echo ""
echo "================================================"
echo ""

# Test 3: Search customers
echo "Test 3: Searching customers..."
echo "GET ${BASE_URL}?search=test"
curl -X GET "${BASE_URL}?search=test&per_page=5" \
  -H "Accept: application/json" \
  -H "X-Tenant-ID: ${TENANT_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  | json_pp
echo ""
echo "================================================"
echo ""

# Test 4: Get customer by ID (if exists)
CUSTOMER_ID=1  # Change to an existing customer ID
echo "Test 4: Getting customer details (ID: ${CUSTOMER_ID})..."
echo "GET ${BASE_URL}/${CUSTOMER_ID}"
curl -X GET "${BASE_URL}/${CUSTOMER_ID}" \
  -H "Accept: application/json" \
  -H "X-Tenant-ID: ${TENANT_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  | json_pp
echo ""
echo "================================================"
echo ""

# Test 5: Create a new customer
echo "Test 5: Creating a new customer..."
echo "POST ${BASE_URL}"
curl -X POST "${BASE_URL}" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: ${TENANT_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "company": "Test Company",
    "gender": "Mr",
    "firstname": "John",
    "lastname": "Doe",
    "email": "john.doe@test.com",
    "phone": "+33123456789",
    "mobile": "+33612345678",
    "occupation": "Developer"
  }' \
  | json_pp
echo ""
echo "================================================"
echo ""

echo "Tests completed!"
echo ""
echo "Note: Make sure to:"
echo "1. Replace TENANT_ID with your actual tenant ID"
echo "2. Replace TOKEN with your actual Sanctum token"
echo "3. Adjust CUSTOMER_ID for test 4 to an existing customer"
