// React Imports
import { useRef } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports
import { styled } from '@mui/material/styles'


// Type Imports
import type { ChildrenType } from '@core/types'
import type { Locale } from '@configs/i18n'

// Component Imports
import NavHeader from '@menu/components/vertical-menu/NavHeader'
import Logo from '@components/layout/shared/Logo'
import NavCollapseIcons from '@menu/components/vertical-menu/NavCollapseIcons'

// Hook Imports
import useHorizontalNav from '@menu/hooks/useHorizontalNav'

// Util Imports
import { mapHorizontalToVerticalMenu } from '@menu/utils/menuUtils'
import { getLocalizedUrl } from '@/utils/i18n'

const StyledBoxForShadow = styled('div')(({ theme }) => ({
  top: 60,
  left: -8,
  zIndex: 2,
  opacity: 0,
  position: 'absolute',
  pointerEvents: 'none',
  width: 'calc(100% + 15px)',
  height: theme.mixins.toolbar.minHeight,
  transition: 'opacity .15s ease-in-out',
  background: `linear-gradient(var(--mui-palette-background-default) ${
    theme.direction === 'rtl' ? '95%' : '5%'
  }, rgb(var(--mui-palette-background-defaultChannel) / 0.85) 30%, rgb(var(--mui-palette-background-defaultChannel) / 0.5) 65%, rgb(var(--mui-palette-background-defaultChannel) / 0.3) 75%, transparent)`,
  '&.scrolled': {
    opacity: 1
  }
}))

const VerticalNavContent = ({ children }: ChildrenType) => {
  // Hooks
  useHorizontalNav()
  const { lang: locale } = useParams()

  // Refs
  const shadowRef = useRef(null)

  // Use native scroll for better performance - eliminates PerfectScrollbar forced reflows
  const scrollMenu = (container: any) => {
    const target = container.target

    if (shadowRef && target.scrollTop > 0) {
      // @ts-ignore
      if (!shadowRef.current.classList.contains('scrolled')) {
        // @ts-ignore
        shadowRef.current.classList.add('scrolled')
      }
    } else {
      // @ts-ignore
      shadowRef.current.classList.remove('scrolled')
    }
  }

  return (
    <>
      <NavHeader>
        <Link href={getLocalizedUrl('/', locale as Locale)}>
          <Logo />
        </Link>
        <NavCollapseIcons />
      </NavHeader>
      <StyledBoxForShadow ref={shadowRef} />
      <div
        className='bs-full overflow-y-auto overflow-x-hidden native-scroll'
        onScroll={scrollMenu}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(var(--mui-palette-text-primaryChannel) / 0.3) transparent'
        }}
      >
        {mapHorizontalToVerticalMenu(children)}
      </div>
    </>
  )
}

export default VerticalNavContent
