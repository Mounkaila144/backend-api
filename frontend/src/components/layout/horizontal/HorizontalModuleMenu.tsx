'use client'

// React Imports
import { Fragment, useMemo } from 'react'

// Next Imports
import { useParams, usePathname } from 'next/navigation'

// Component Imports
import { MenuItem, SubMenu } from '@menu/horizontal-menu'

// Hook Imports
import { useConfigMenus } from '@/shared/hooks/useConfigMenus'
import { useTranslation } from '@/shared/i18n/use-translation'

// Type Imports
import type { MenuConfig, UserRole } from '@/shared/types/menu-config.types'

/**
 * Horizontal Module Menu Component
 *
 * Dynamically renders menu items from module configurations for horizontal layout
 */
const HorizontalModuleMenu = () => {
  // Hooks
  const { lang: locale } = useParams()
  const pathname = usePathname()
  const { t } = useTranslation()

  // Detect current role from URL
  const currentRole: UserRole | undefined = useMemo(() => {
    if (pathname?.includes('/superadmin')) {
      return 'superadmin'
    } else if (pathname?.includes('/admin')) {
      return 'admin'
    }

    
return undefined
  }, [pathname])

  const { menus, isLoading } = useConfigMenus({ visibleOnly: true, role: currentRole })

  // Render loading state
  if (isLoading) {
    return null
  }

  // Recursive function to render menu items
  const renderMenuItem = (menu: MenuConfig): JSX.Element | null => {
    // Skip invisible or inactive menus
    if (menu.isVisible === false || menu.isActive === false) {
      return null
    }

    // Get icon based on type
    const getIcon = () => {
      if (!menu.icon) return undefined

      if (menu.icon.type === 'emoji') {
        return <span style={{ fontSize: '1.25rem' }}>{menu.icon.value}</span>
      }

      if (menu.icon.type === 'icon-class') {
        return <i className={menu.icon.value} />
      }

      return <i className={menu.icon.value} />
    }

    // Has children - render as SubMenu
    if (menu.children && menu.children.length > 0) {
      return (
        <SubMenu key={menu.id} label={t(menu.label)} icon={getIcon()}>
          {menu.children.map(child => renderMenuItem(child))}
        </SubMenu>
      )
    }

    // No children - render as MenuItem
    if (menu.route) {
      const href = menu.route.startsWith('/') ? `/${locale}${menu.route}` : menu.route

      return (
        <MenuItem key={menu.id} href={href} icon={getIcon()}>
          {t(menu.label)}
        </MenuItem>
      )
    }

    // Menu item without route (shouldn't happen, but handle it)
    return (
      <MenuItem key={menu.id} icon={getIcon()}>
        {t(menu.label)}
      </MenuItem>
    )
  }

  return (
    <Fragment>
      {menus.map(menu => renderMenuItem(menu))}
    </Fragment>
  )
}

export default HorizontalModuleMenu
