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

/** Flatten menus to items with routes */
const flattenMenuItems = (items: MenuConfig[]): MenuConfig[] => {
  const result: MenuConfig[] = []

  for (const item of items) {
    if (item.route) result.push(item)
    if (item.children) result.push(...flattenMenuItems(item.children))
  }

  return result
}

const NoResult = ({ searchValue, setOpen }: { searchValue: string; setOpen: (value: boolean) => void }) => {
  // Hooks
  const { lang: locale } = useParams()
  const { menus } = useConfigMenus({ visibleOnly: true })

  // Show first 3 real menus as fallback suggestions
  const suggestions = flattenMenuItems(menus).slice(0, 3)

  return (
    <div className='flex items-center justify-center grow flex-wrap plb-14 pli-16 overflow-y-auto overflow-x-hidden bs-full'>
      <div className='flex flex-col items-center'>
        <i className='ri-file-forbid-line text-[64px] mbe-2.5' />
        <p className='text-xl mbe-11'>{`No result for "${searchValue}"`}</p>
        {suggestions.length > 0 && (
          <>
            <p className='mbe-[18px] text-textDisabled'>Try searching for</p>
            <ul className='flex flex-col gap-4'>
              {suggestions.map(item => (
                <li key={item.id} className='flex items-center'>
                  <Link
                    href={getLocalizedUrl(item.route!, locale as Locale)}
                    className='flex items-center gap-2 hover:text-primary focus-visible:text-primary focus-visible:outline-0'
                    onClick={() => setOpen(false)}
                  >
                    {item.icon?.type === 'emoji' ? (
                      <span className='text-xl'>{item.icon.value}</span>
                    ) : item.icon?.type === 'icon-class' ? (
                      <i className={`${item.icon.value} text-xl`} />
                    ) : null}
                    <p className='overflow-hidden whitespace-nowrap overflow-ellipsis'>{item.label}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}

export default NoResult
