/**
 * Menu Route Generator Utility
 *
 * Transforms database menu structure into Next.js routes
 * Handles conversion from snake_case module names to PascalCase
 */

/**
 * Converts snake_case to PascalCase
 * Examples:
 *   customers_contracts → CustomersContracts
 *   products_installer_communication → ProductsInstallerCommunication
 */
export function toPascalCase(str: string): string {
  if (!str) return '';

  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Removes numeric prefixes from menu names
 * Examples:
 *   0000_users_product_installer_communications → users_product_installer_communications
 *   0010_contracts_list1 → contracts_list1
 *   10_meetings → meetings
 */
export function removeNumericPrefix(str: string): string {
  if (!str) return '';

  // Remove leading digits and underscores (e.g., "0010_" or "10_")
  return str.replace(/^\d+_/, '');
}

/**
 * Generates Next.js route path from module and name
 *
 * @param module - Module name from database (snake_case, e.g., "customers_contracts")
 * @param name - Menu name from database (may have numeric prefix, e.g., "0010_contracts_list1")
 * @param baseRoute - Base route prefix (default: "/admin")
 *
 * @returns Route path (e.g., "/admin/customers-contracts/contracts-list1")
 *
 * Examples:
 *   generateRoutePath("customers_contracts", "0010_contracts_list1")
 *     → "/admin/customers-contracts/contracts-list1"
 *
 *   generateRoutePath("products_installer_communication", "0000_users_product_installer_communications")
 *     → "/admin/products-installer-communication/users-product-installer-communications"
 */
export function generateRoutePath(
  module: string,
  name: string,
  baseRoute: string = '/admin'
): string {
  if (!module && !name) {
    return baseRoute;
  }

  // Clean the name by removing numeric prefix
  const cleanName = removeNumericPrefix(name);

  // Convert to kebab-case for URL
  const moduleKebab = module ? module.replace(/_/g, '-').toLowerCase() : '';
  const nameKebab = cleanName ? cleanName.replace(/_/g, '-').toLowerCase() : '';

  // Build route
  const parts = [baseRoute];

  if (moduleKebab) parts.push(moduleKebab);
  if (nameKebab) parts.push(nameKebab);

  return parts.join('/');
}

/**
 * Generates module and component names for dynamic imports
 *
 * @param module - Module name from database (snake_case)
 * @param name - Menu name from database (may have numeric prefix)
 *
 * @returns Object with moduleName and componentName in PascalCase
 *
 * Examples:
 *   generateModuleInfo("customers_contracts", "0010_contracts_list1")
 *     → { moduleName: "CustomersContracts", componentName: "ContractsList1" }
 *
 *   generateModuleInfo("products_installer_communication", "0000_users_product")
 *     → { moduleName: "ProductsInstallerCommunication", componentName: "UsersProduct" }
 */
export function generateModuleInfo(module: string, name: string) {
  const cleanName = removeNumericPrefix(name);

  return {
    moduleName: toPascalCase(module),
    componentName: toPascalCase(cleanName),
    moduleSnakeCase: module,
    nameSnakeCase: cleanName,
  };
}

/**
 * Generates full module path for dynamic imports
 *
 * @param module - Module name from database
 * @param name - Menu name from database
 * @param layer - Module layer (admin, superadmin, frontend)
 *
 * @returns Import path for the component
 *
 * Example:
 *   generateModulePath("customers_contracts", "0010_contracts_list1", "admin")
 *     → "@/src/modules/CustomersContracts/admin/components/ContractsList1"
 */
export function generateModulePath(
  module: string,
  name: string,
  layer: 'admin' | 'superadmin' | 'frontend' = 'admin'
): string {
  const { moduleName, componentName } = generateModuleInfo(module, name);

  return `@/src/modules/${moduleName}/${layer}/components/${componentName}`;
}

/**
 * Checks if a module exists in the filesystem
 * This is a helper for validation - implementation depends on your setup
 */
export function getModuleKey(module: string, name: string): string {
  const { moduleName, componentName } = generateModuleInfo(module, name);

  
return `${moduleName}/${componentName}`;
}

/**
 * Validates and transforms menu item for routing
 */
export interface MenuRouteInfo {
  path: string;
  moduleName: string;
  componentName: string;
  importPath: string;
  moduleKey: string;
}

export function transformMenuToRoute(
  menu: {
    module: string;
    name: string;
  },
  baseRoute: string = '/admin',
  layer: 'admin' | 'superadmin' | 'frontend' = 'admin'
): MenuRouteInfo {
  const path = generateRoutePath(menu.module, menu.name, baseRoute);
  const moduleInfo = generateModuleInfo(menu.module, menu.name);
  const importPath = generateModulePath(menu.module, menu.name, layer);
  const moduleKey = getModuleKey(menu.module, menu.name);

  return {
    path,
    moduleName: moduleInfo.moduleName,
    componentName: moduleInfo.componentName,
    importPath,
    moduleKey,
  };
}