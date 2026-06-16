// React Imports
import { forwardRef } from 'react'
import type { ForwardRefRenderFunction, HTMLAttributes } from 'react'

// Type Imports
import type { ChildrenType, RootStylesType } from '../../types'

// Styled Component Imports
import StyledHorizontalSubMenuContent from '../../styles/horizontal/StyledHorizontalSubMenuContent'

// Style Imports
import styles from '../../styles/styles.module.css'

export type SubMenuContentProps = HTMLAttributes<HTMLDivElement> &
  RootStylesType &
  Partial<ChildrenType> & {
    open?: boolean
    browserScroll?: boolean
    firstLevel?: boolean
    top?: number
  }

const SubMenuContent: ForwardRefRenderFunction<HTMLDivElement, SubMenuContentProps> = (props, ref) => {
  // Props
  const { children, open, firstLevel, top, browserScroll, ...rest } = props

  return (
    <StyledHorizontalSubMenuContent
      ref={ref}
      firstLevel={firstLevel}
      open={open}
      top={top}
      browserScroll={browserScroll}
      {...rest}
    >
      {/* Use native scroll for better performance - eliminates PerfectScrollbar forced reflows */}
      {!browserScroll ? (
        <div
          className="submenu-scroll-container"
          style={{
            maxBlockSize: `calc((var(--vh, 1vh) * 100) - ${top}px)`,
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
    </StyledHorizontalSubMenuContent>
  )
}

export default forwardRef(SubMenuContent)
