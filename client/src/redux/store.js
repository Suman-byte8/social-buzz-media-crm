import { configureStore } from '@reduxjs/toolkit';
import settingsReducer from './slices/settingsSlice';
import clientsReducer from './slices/clientsSlice';

export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    clients: clientsReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});
