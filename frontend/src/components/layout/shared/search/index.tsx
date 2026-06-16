'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

// Next Imports
import { useParams, useRouter, usePathname } from 'next/navigation'

// MUI Imports
import IconButton from '@mui/material/IconButton'

// Third-party Imports
import classnames from 'classnames'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from 'cmdk'
import { Title, Description } from '@radix-ui/react-dialog'

// Type Imports
import type { Locale } from '@configs/i18n'
import type { MenuConfig } from '@/shared/types/menu-config.types'

// Component Imports
import DefaultSuggestions from './DefaultSuggestions'
import NoResult from './NoResult'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'
import { useSettings } from '@core/hooks/useSettings'
import { useConfigMenus } from '@/shared/hooks/useConfigMenus'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

// Style Imports
import './styles.css'

type Item = {
  id: string
  name: string
  url: string
  excludeLang?: boolean
  icon: string
  iconType?: 'emoji' | 'icon-class' | 'svg' | 'lucide'
  shortcut?: string
}

type Section = {
  title: string
  items: Item[]
}

type SearchItemProps = {
  children: ReactNode
  shortcut?: string
  value: string
  url: string
  currentPath: string
  onSelect?: () => void
}

/** Flatten hierarchical menus to items with routes */
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

// SearchItem Component for introduce the shortcut keys
const SearchItem = ({ children, shortcut, value, currentPath, url, onSelect = () => {} }: SearchItemProps) => {
  return (
    <CommandItem
      onSelect={onSelect}
      value={value}
      className={classnames({
        'active-searchItem': currentPath === url
      })}
    >
      {children}
      {shortcut && (
        <div cmdk-vercel-shortcuts=''>
          {shortcut.split(' ').map(key => {
            return <kbd key={key}>{key}</kbd>
          })}
        </div>
      )}
    </CommandItem>
  )
}

// Helper function to filter and limit results per section based on the number of sections
const getFilteredResults = (sections: Section[]) => {
  const limit = sections.length > 1 ? 3 : 5

  return sections.map(section => ({
    ...section,
    items: section.items.slice(0, limit)
  }))
}

// Footer component for the search menu
const CommandFooter = () => {
  return (
    <div cmdk-footer=''>
      <div className='flex items-center gap-1'>
        <kbd>
          <i className='ri-arrow-up-line text-base' />
        </kbd>
        <kbd>
          <i className='ri-arrow-down-line text-base' />
        </kbd>
        <span>to navigate</span>
      </div>
      <div className='flex items-center gap-1'>
        <kbd>
          <i className='ri-corner-down-left-line text-base' />
        </kbd>
        <span>to open</span>
      </div>
      <div className='flex items-center gap-1'>
        <kbd>esc</kbd>
        <span>to close</span>
      </div>
    </div>
  )
}

const NavSearch = () => {
  // States
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  // Hooks
  const router = useRouter()
  const pathName = usePathname()
  const { settings } = useSettings()
  const { lang: locale } = useParams()
  const { isBreakpointReached } = useVerticalNav()
  const { menus } = useConfigMenus({ visibleOnly: true })

  // Build search sections dynamically from real menus
  const menuSections = useMemo<Section[]>(() => {
    const allItems = flattenMenuItems(menus)

    const grouped = allItems.reduce<Record<string, Item[]>>((acc, menu) => {
      const section = menu.module || 'Other'

      if (!acc[section]) acc[section] = []

      acc[section].push({
        id: menu.id,
        name: menu.label,
        url: menu.route!,
        icon: menu.icon?.value ?? '',
        iconType: menu.icon?.type,
      })

      return acc
    }, {})

    return Object.entries(grouped).map(([title, items]) => ({ title, items }))
  }, [menus])

  // When an item is selected from the search results
  const onSearchItemSelect = (item: Item) => {
    item.url.startsWith('http')
      ? window.open(item.url, '_blank')
      : router.push(item.excludeLang ? item.url : getLocalizedUrl(item.url, locale as Locale))
    setOpen(false)
  }

  // Filter the data based on the search query
  const filteredData = (sections: Section[], query: string) => {
    const searchQuery = query.trim().toLowerCase()

    return sections
      .filter(section => {
        const sectionMatches = section.title.toLowerCase().includes(searchQuery)

        const itemsMatch = section.items.some(
          item =>
            item.name.toLowerCase().includes(searchQuery) ||
            (item.shortcut && item.shortcut.toLowerCase().includes(searchQuery))
        )

        return sectionMatches || itemsMatch
      })
      .map(section => ({
        ...section,
        items: section.items.filter(
          item =>
            section.title.toLowerCase().includes(searchQuery) ||
            item.name.toLowerCase().includes(searchQuery) ||
            (item.shortcut && item.shortcut.toLowerCase().includes(searchQuery))
        )
      }))
  }

  const limitedData = getFilteredResults(filteredData(menuSections, searchValue))

  // Render icon based on type (emoji vs icon-class)
  const renderIcon = (item: Item) => {
    if (!item.icon) return null

    if (item.iconType === 'emoji') {
      return <span className='text-xl'>{item.icon}</span>
    }

    return (
      <div className='flex text-xl'>
        <i className={item.icon} />
      </div>
    )
  }

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(open => !open)
      }
    }

    document.addEventListener('keydown', down)

    return () => document.removeEventListener('keydown', down)
  }, [])

  // Reset the search value when the menu is closed
  useEffect(() => {
    if (!open && searchValue !== '') {
      setSearchValue('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <>
      {isBreakpointReached || settings.layout === 'horizontal' ? (
        <IconButton className='text-textPrimary' onClick={() => setOpen(true)}>
          <i className='ri-search-line' />
        </IconButton>
      ) : (
        <div className='flex items-center gap-2 cursor-pointer' onClick={() => setOpen(true)}>
          <IconButton className='text-textPrimary' onClick={() => setOpen(true)}>
            <i className='ri-search-line' />
          </IconButton>
          <div className='whitespace-nowrap select-none text-textDisabled'>Search ⌘K</div>
        </div>
      )}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className='flex items-center justify-between border-be pli-4 plb-3 gap-2'>
          <Title hidden />
          <Description hidden />
          <i className='ri-search-line' />
          <CommandInput value={searchValue} onValueChange={setSearchValue} />
          <span className='text-textDisabled'>[esc]</span>
          <i className='ri-close-line cursor-pointer' onClick={() => setOpen(false)} />
        </div>
        <CommandList>
          {searchValue ? (
            limitedData.length > 0 ? (
              limitedData.map((section, index) => (
                <CommandGroup key={index} heading={section.title.toUpperCase()} className='text-xs'>
                  {section.items.map((item, i) => {
                    return (
                      <SearchItem
                        shortcut={item.shortcut}
                        key={i}
                        currentPath={pathName}
                        url={getLocalizedUrl(item.url, locale as Locale)}
                        value={`${item.name} ${section.title} ${item.shortcut ?? ''}`}
                        onSelect={() => onSearchItemSelect(item)}
                      >
                        {renderIcon(item)}
                        {item.name}
                      </SearchItem>
                    )
                  })}
                </CommandGroup>
              ))
            ) : (
              <CommandEmpty>
                <NoResult searchValue={searchValue} setOpen={setOpen} />
              </CommandEmpty>
            )
          ) : (
            <DefaultSuggestions setOpen={setOpen} />
          )}
        </CommandList>
        <CommandFooter />
      </CommandDialog>
    </>
  )
}

export default NavSearch
