/**
 * Customers Service
 * Handles API calls for customer management
 */

import { apiClient } from '@/shared/lib/api-client';
import type {
  Customer,
  CustomerListResponse,
  CustomerDetailResponse,
  CustomerStatsResponse,
  CustomerFilters,
} from '../../types';

/** Fields accepted when creating a new customer. */
export type CreateCustomerData = Omit<Customer, 'id' | 'full_name' | 'display_name' | 'created_at' | 'updated_at'>;

/** Fields accepted when updating an existing customer (all optional). */
export type UpdateCustomerData = Partial<CreateCustomerData>;

const CUSTOMERS_BASE_URL = '/admin/customers';

export const customersService = {
  /**
   * Get paginated list of customers
   */
  async getCustomers(filters?: CustomerFilters): Promise<CustomerListResponse> {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.sort_by) params.append('sort_by', filters.sort_by);
    if (filters?.sort_order) params.append('sort_order', filters.sort_order);
    if (filters?.per_page) params.append('per_page', filters.per_page.toString());
    if (filters?.page) params.append('page', filters.page.toString());

    const url = `${CUSTOMERS_BASE_URL}${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await apiClient.get<CustomerListResponse>(url);

    return response.data;
  },

  /**
   * Get customer by ID
   */
  async getCustomer(id: number): Promise<CustomerDetailResponse> {
    const response = await apiClient.get<CustomerDetailResponse>(`${CUSTOMERS_BASE_URL}/${id}`);

    
return response.data;
  },

  /**
   * Get customer statistics
   */
  async getStats(): Promise<CustomerStatsResponse> {
    const response = await apiClient.get<CustomerStatsResponse>(`${CUSTOMERS_BASE_URL}/stats`);

    
return response.data;
  },

  /**
   * Create a new customer
   */
  async createCustomer(data: CreateCustomerData): Promise<CustomerDetailResponse> {
    const response = await apiClient.post<CustomerDetailResponse>(CUSTOMERS_BASE_URL, data);

    
return response.data;
  },

  /**
   * Update a customer
   */
  async updateCustomer(id: number, data: UpdateCustomerData): Promise<CustomerDetailResponse> {
    const response = await apiClient.put<CustomerDetailResponse>(`${CUSTOMERS_BASE_URL}/${id}`, data);

    
return response.data;
  },

  /**
   * Delete a customer (soft delete)
   */
  async deleteCustomer(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`${CUSTOMERS_BASE_URL}/${id}`);

    
return response.data;
  },
};
