'use client'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// Type Imports
import type { Locale } from '@configs/i18n'
import type { MenuConfig } from '@/shared/types/menu-config.types'

// Hook Imports
import { useConfigMenus } from '@/shared/hooks/useConfigMenus'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

/** Flatten hierarchical menus to items that have routes */
const flattenMenuItems = (items: MenuConfig[]): MenuConfig[] => {
  const result: MenuConfig[] = []

  for (const item of items) {
    if (item.route) {
      result.push(item)
    }

    if (item.children) {
      result.push(...flattenMenuItems(item.children))
    }
  }

  return result
}

/** Render menu icon based on its type (emoji, icon-class, etc.) */
const MenuItemIcon = ({ menu }: { menu: MenuConfig }) => {
  if (!menu.icon) return null

  if (menu.icon.type === 'emoji') {
    return <span className='text-xl'>{menu.icon.value}</span>
  }

  if (menu.icon.type === 'icon-class') {
    return <i className={`${menu.icon.value} flex text-xl`} />
  }

  return null
}

const DefaultSuggestions = ({ setOpen }: { setOpen: (value: boolean) => void }) => {
  // Hooks
  const { lang: locale } = useParams()
  const { menus, isLoading } = useConfigMenus({ visibleOnly: true })

  if (isLoading) return null

  const allItems = flattenMenuItems(menus)

  // Group items by role
  const adminItems = allItems.filter(item => item.roles?.includes('admin'))
  const superAdminItems = allItems.filter(item => item.roles?.includes('superadmin'))
  const generalItems = allItems.filter(item => !item.roles || item.roles.length === 0)

  const sections: { label: string; items: MenuConfig[] }[] = []

  if (adminItems.length > 0) sections.push({ label: 'Admin', items: adminItems })
  if (superAdminItems.length > 0) sections.push({ label: 'Super Admin', items: superAdminItems })
  if (generalItems.length > 0) sections.push({ label: 'General', items: generalItems })

  if (sections.length === 0) return null

  return (
    <div className='flex grow flex-wrap gap-x-[48px] gap-y-8 plb-14 pli-16 overflow-y-auto overflow-x-hidden bs-full'>
      {sections.map(section => (
        <div
          key={section.label}
          className='flex flex-col justify-center overflow-x-hidden gap-4 basis-full sm:basis-[calc((100%-3rem)/2)]'
        >
          <p className='text-xs uppercase text-textDisabled tracking-[0.8px]'>{section.label}</p>
          <ul className='flex flex-col gap-4'>
            {section.items.map(item => (
              <li key={item.id} className='flex'>
                <Link
                  href={getLocalizedUrl(item.route!, locale as Locale)}
                  className='flex items-center overflow-x-hidden cursor-pointer gap-2 hover:text-primary focus-visible:text-primary focus-visible:outline-0'
                  onClick={() => setOpen(false)}
                >
                  <MenuItemIcon menu={item} />
                  <p className='text-[15px] overflow-hidden whitespace-nowrap overflow-ellipsis'>{item.label}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export default DefaultSuggestions
