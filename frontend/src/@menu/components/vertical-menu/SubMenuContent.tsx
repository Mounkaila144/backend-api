// React Imports
import { forwardRef, useEffect, useState, useCallback, useRef } from 'react'
import type { ForwardRefRenderFunction, HTMLAttributes, MutableRefObject } from 'react'

// Type Imports
import type { VerticalMenuContextProps } from './Menu'
import type { ChildrenType, RootStylesType } from '../../types'

// Styled Component Imports
import StyledSubMenuContent from '../../styles/StyledSubMenuContent'

// Style Imports
import styles from '../../styles/styles.module.css'

export type SubMenuContentProps = HTMLAttributes<HTMLDivElement> &
  RootStylesType &
  Partial<ChildrenType> & {
    open?: boolean
    openWhenCollapsed?: boolean
    openWhenHovered?: boolean
    transitionDuration?: VerticalMenuContextProps['transitionDuration']
    isPopoutWhenCollapsed?: boolean
    level?: number
    isCollapsed?: boolean
    isHovered?: boolean
    browserScroll?: boolean
  }

const SubMenuContent: ForwardRefRenderFunction<HTMLDivElement, SubMenuContentProps> = (props, ref) => {
  // Props
  const {
    children,
    open,
    level,
    isCollapsed,
    isHovered,
    transitionDuration,
    isPopoutWhenCollapsed,
    openWhenCollapsed,
    browserScroll,
    ...rest
  } = props

  // States
  const [mounted, setMounted] = useState(false)

  // Use a ref to track the cached height to avoid repeated measurements
  const cachedHeightRef = useRef<number | null>(null)

  // Refs
  const SubMenuContentRef = ref as MutableRefObject<HTMLDivElement>

  // Optimized animation using requestAnimationFrame to batch DOM reads/writes
  const animateOpen = useCallback((target: HTMLDivElement, duration: number) => {
    // Use requestAnimationFrame to batch layout reads
    requestAnimationFrame(() => {
      target.style.display = 'block'
      target.style.overflow = 'hidden'
      target.style.blockSize = 'auto'

      // Single layout read
      const height = target.offsetHeight

      cachedHeightRef.current = height

      // Batch all writes together
      requestAnimationFrame(() => {
        target.style.blockSize = '0px'

        // Force a single reflow, then animate
        requestAnimationFrame(() => {
          target.style.blockSize = `${height}px`

          setTimeout(() => {
            target.style.overflow = 'auto'
            target.style.blockSize = 'auto'
          }, duration)
        })
      })
    })
  }, [])

  const animateClose = useCallback((target: HTMLDivElement, duration: number) => {
    requestAnimationFrame(() => {
      target.style.overflow = 'hidden'

      // Use cached height if available to avoid layout read
      const height = cachedHeightRef.current ?? target.offsetHeight

      target.style.blockSize = `${height}px`

      requestAnimationFrame(() => {
        target.style.blockSize = '0px'

        setTimeout(() => {
          target.style.overflow = 'auto'
          target.style.display = 'none'
        }, duration)
      })
    })
  }, [])

  useEffect(() => {
    if (mounted) {
      const target = SubMenuContentRef?.current

      if (!target) return

      if (open || (open && isHovered)) {
        animateOpen(target, transitionDuration ?? 300)
      } else {
        animateClose(target, transitionDuration ?? 300)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted, SubMenuContentRef])

  useEffect(() => {
    setMounted(true)
  }, [isHovered])

  return (
    <StyledSubMenuContent
      ref={ref}
      level={level}
      isCollapsed={isCollapsed}
      isHovered={isHovered}
      open={open}
      openWhenCollapsed={openWhenCollapsed}
      isPopoutWhenCollapsed={isPopoutWhenCollapsed}
      transitionDuration={transitionDuration}
      browserScroll={browserScroll}
      {...rest}
    >
      {/* Use native scroll with CSS styling for better performance */}
      {!browserScroll && level === 0 && isPopoutWhenCollapsed && isCollapsed ? (
        <div
          className="submenu-scroll-container"
          style={{
            maxBlockSize: `calc((var(--vh, 1vh) * 100))`,
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(var(--mui-palette-text-primaryChannel) / 0.3) transparent'
          }}
        >
          <ul className={styles.ul}>{children}</ul>
        </div>
      ) : (
        <ul className={styles.ul}>{children}</ul>
      )}
    </StyledSubMenuContent>
  )
}

export default forwardRef(SubMenuContent)
