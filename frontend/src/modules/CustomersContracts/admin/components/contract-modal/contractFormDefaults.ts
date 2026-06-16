import type { CreateContractData } from '../../../types';

export type ContractFormData = CreateContractData;

export function getInitialFormData(): ContractFormData {
  return {
    // Required dates
    quoted_at: '',
    billing_at: '',
    opc_at: '',
    opened_at: '',

    // Optional dates
    sent_at: '',
    payment_at: '',
    apf_at: '',

    // IDs
    reference: '',
    customer_id: undefined,
    meeting_id: undefined,
    financial_partner_id: undefined,
    tax_id: undefined,
    team_id: undefined,
    telepro_id: undefined,
    sale_1_id: undefined,
    sale_2_id: undefined,
    manager_id: undefined,
    assistant_id: undefined,
    installer_user_id: undefined,
    opened_at_range_id: undefined,
    opc_range_id: undefined,
    state_id: undefined,
    install_state_id: undefined,
    admin_status_id: undefined,
    company_id: undefined,

    // Prices
    total_price_with_taxe: undefined,
    total_price_without_taxe: undefined,

    // Other
    remarks: '',
    variables: undefined,
    is_signed: 'NO',
    status: 'ACTIVE',

    // Required customer info
    customer: {
      lastname: '',
      firstname: '',
      phone: '',
      union_id: undefined,
      address: {
        address1: '',
        postcode: '',
        city: '',
      },
    },

    // Products
    products: [],
  };
}

export function createHandleInputChange(
  setFormData: React.Dispatch<React.SetStateAction<ContractFormData>>
) {
  return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    const isNumber = type === 'number';
    const finalValue = isNumber && value !== '' ? Number(value) : value;

    if (name.startsWith('customer.')) {
      const fieldName = name.replace('customer.', '');

      if (fieldName.startsWith('address.')) {
        const addressField = fieldName.replace('address.', '');

        setFormData(prev => ({
          ...prev,
          customer: {
            ...prev.customer!,
            address: {
              ...prev.customer!.address!,
              [addressField]: finalValue,
            },
          },
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          customer: {
            ...prev.customer!,
            [fieldName]: finalValue,
          },
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: finalValue === '' ? undefined : finalValue,
      }));
    }
  };
}

export function formatDateForInput(dateString: string | null | undefined): string {
  if (!dateString) return '';

  // Extract only the date part (YYYY-MM-DD) to avoid timezone issues
  const dateOnly = dateString.split('T')[0].split(' ')[0];

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    return dateOnly;
  }

  // Fallback: try to parse and format without timezone conversion
  const parts = dateString.match(/(\d{4})-(\d{2})-(\d{2})/);

  if (parts) {
    return `${parts[1]}-${parts[2]}-${parts[3]}`;
  }

  return '';
}
