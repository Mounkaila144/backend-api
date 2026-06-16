// React Imports
import type { SVGAttributes } from 'react'

interface LogoProps extends SVGAttributes<SVGElement> {

  /** Override color for monochrome usage (e.g., white on dark backgrounds) */
  color?: string
}

const Logo = ({ color, ...props }: LogoProps) => {
  const brandColor = color ?? '#19acff'
  const textColor = color ?? 'var(--mui-palette-text-primary)'

  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 277.66 82.11' {...props}>
      <g style={{ isolation: 'isolate' }}>
        <text
          fill={brandColor}
          style={{
            fontSize: 72,
            fontFamily: "'Franklin Gothic Medium', 'Arial Narrow Bold', Arial, sans-serif",
            fontWeight: 500,
            letterSpacing: '0.04em',
          }}
          transform='translate(0 60.03)'
        >
          i Call
        </text>
        <text
          fill={textColor}
          style={{
            fontSize: 72,
            fontFamily: "'Franklin Gothic Medium', 'Arial Narrow Bold', Arial, sans-serif",
            fontWeight: 500,
            letterSpacing: '0.04em',
          }}
          transform='translate(187.6 60.03)'
        >
          26
        </text>
      </g>
      <path
        d='M46.43,53.07A32.77,32.77,0,0,1,44,43.59c-.41-4,.17-5.63-.75-6.36C41,35.44,31.92,40.78,31,48c-.87,6.49,5.1,11.86,10.32,16.56,3.83,3.44,13.16,11.84,23.47,10,4.11-.74,6-2.69,10.32-1.8s5.15,3.28,9.66,3.37c2.4,0,4.28-.59,7.33-1.63,2.7-1,4.07-1.44,4.34-2.56.48-2.07-3-4.71-4.52-5.82A14.61,14.61,0,0,0,85.47,63c-4.2-.65-6.5,1.8-10.81,3.63-1,.42-11.39,4.66-19.3,0C50,63.45,47.54,57.22,46.43,53.07Z'
        fill={textColor}
      />
    </svg>
  )
}

export default Logo
