/**
 * Customer Types
 */

export interface Customer {
  id: number;
  company: string | null;
  gender: 'Mr' | 'Ms' | 'Mrs' | null;
  firstname: string | null;
  lastname: string | null;
  full_name: string;
  display_name: string;
  email: string;
  phone: string;
  mobile: string;
  mobile2: string;
  phone1: string;
  birthday: string | null;
  age: string | null;
  salary: string | null;
  occupation: string | null;
  status: 'ACTIVE' | 'DELETE';
  union: {
    id: number;
    name: string;
  } | null;
  primary_address: {
    id: number;
    full_address: string;
    city: string;
    postcode: string;
  } | null;
  primary_contact: {
    id: number;
    full_name: string;
    email: string;
    phone: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerListResponse {
  success: boolean;
  data: Customer[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
}

export interface CustomerDetailResponse {
  success: boolean;
  data: Customer;
}

export interface CustomerStatsResponse {
  success: boolean;
  data: {
    total_customers: number;
    total_deleted: number;
    with_company: number;
    with_email: number;
    with_mobile: number;
  };
}

export interface CustomerFilters {
  search?: string;
  status?: 'ACTIVE' | 'DELETE';
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}