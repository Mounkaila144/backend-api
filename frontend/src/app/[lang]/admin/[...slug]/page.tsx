// Component Imports
import DynamicModuleLoader from '@/shared/components/DynamicModuleLoader'

// Type Imports
import type { Locale } from '@configs/i18n'

type Props = {
  params: Promise<{
    lang: Locale
    slug: string[]
  }>
}

/**
 * Dynamic Route Handler for Admin Modules
 *
 * This route handles all dynamic module loading for the admin interface.
 * Examples:
 * - /en/admin/customers/customers � Customers module
 * - /en/admin/customers-contracts/contracts-list � CustomersContracts module
 *
 * The slug array is converted to:
 * 1. Module name (from first segment, kebab-case to PascalCase)
 * 2. Component name (from second segment, kebab-case to PascalCase)
 */
const DynamicAdminPage = async (props: Props) => {
  const params = await props.params

  return <DynamicModuleLoader slug={params.slug} context="admin" />
}

export default DynamicAdminPage
