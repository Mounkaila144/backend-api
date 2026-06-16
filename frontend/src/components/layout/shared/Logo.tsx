'use client'

// React Imports
import type { CSSProperties } from 'react'

// Component Imports
import ICall26Logo from '@core/svg/Logo'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'
import { useSettings } from '@core/hooks/useSettings'

const Logo = ({ color }: { color?: CSSProperties['color'] }) => {
  // Hooks
  const { isHovered, transitionDuration, isBreakpointReached } = useVerticalNav()
  const { settings } = useSettings()

  // Vars
  const { layout } = settings
  const isCollapsed = !isBreakpointReached && layout === 'collapsed' && !isHovered

  return (
    <div className='flex items-center min-bs-[24px]'>
      <ICall26Logo
        color={color}
        style={{
          width: isCollapsed ? 40 : 130,
          height: 'auto',
          transition: `width ${transitionDuration}ms ease-in-out`,
        }}
      />
    </div>
  )
}

export default Logo
