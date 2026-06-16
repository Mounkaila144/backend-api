// React Imports
import { memo, useCallback } from 'react'

// MUI Imports
import { useTheme } from '@mui/material/styles'

// Type Imports
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'

// Component Imports
import { Menu } from '@menu/vertical-menu'
import ModuleMenu from './ModuleMenu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

// Menu Data Imports
// import menuData from '@/data/navigation/verticalMenuData'

type RenderExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

type Props = {
  scrollMenu: (container: any, isPerfectScrollbar: boolean) => void
}

const RenderExpandIcon = memo(({ open, transitionDuration }: RenderExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='ri-arrow-right-s-line' />
  </StyledVerticalNavExpandIcon>
))

RenderExpandIcon.displayName = 'RenderExpandIcon'

// Optimized native scroll wrapper - much faster than PerfectScrollbar
const NativeScrollWrapper = memo(({ children, onScroll }: { children: React.ReactNode; onScroll?: (e: any) => void }) => (
  <div
    className='bs-full overflow-y-auto overflow-x-hidden'
    onScroll={onScroll}
    style={{
      scrollbarWidth: 'thin',
      scrollbarColor: 'rgba(var(--mui-palette-text-primaryChannel) / 0.3) transparent',
      willChange: 'scroll-position'
    }}
  >
    {children}
  </div>
))

NativeScrollWrapper.displayName = 'NativeScrollWrapper'

const VerticalMenu = ({ scrollMenu }: Props) => {
  // Hooks
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()

  // Vars
  const { transitionDuration } = verticalNavOptions

  // Memoized scroll handler
  const handleScroll = useCallback((container: any) => {
    scrollMenu(container, false)
  }, [scrollMenu])

  return (

    // Use native scroll for better performance - eliminates PerfectScrollbar forced reflows
    <NativeScrollWrapper onScroll={handleScroll}>
      {/* Vertical Menu from Module Configurations */}
      <Menu
        popoutMenuOffset={{ mainAxis: 17 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='ri-circle-fill' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >
        <ModuleMenu />
      </Menu>
    </NativeScrollWrapper>
  )
}

export default VerticalMenu
