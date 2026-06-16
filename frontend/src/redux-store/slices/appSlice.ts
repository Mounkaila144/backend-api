import { createSlice } from '@reduxjs/toolkit';

/**
 * Slice de base pour l'application
 * Contient l'état global minimal
 */
const appSlice = createSlice({
  name: 'app',
  initialState: {
    initialized: true,
  },
  reducers: {
    // Reducers de base (vides pour le moment)
  },
});

export default appSlice.reducer;
