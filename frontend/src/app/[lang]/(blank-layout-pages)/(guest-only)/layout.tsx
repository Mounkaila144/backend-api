// Type Imports
import type { ChildrenType } from '@core/types'
import type { Locale } from '@configs/i18n'

// HOC Imports
import GuestOnlyRoute from '@/hocs/GuestOnlyRoute'

const Layout = async (props: ChildrenType & { params: Promise<{ lang: string }> }) => {
  const params = await props.params
  const lang = params.lang as Locale

  const { children } = props

  return <GuestOnlyRoute lang={lang}>{children}</GuestOnlyRoute>
}

export default Layout
