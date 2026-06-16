// Third-party Imports
import { configureStore } from '@reduxjs/toolkit'

// Slice Imports
import appReducer from './slices/appSlice'

export const store = configureStore({
  reducer: {
    app: appReducer,
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware({ serializableCheck: false })
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
