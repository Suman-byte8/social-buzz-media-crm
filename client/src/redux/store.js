import { configureStore } from '@reduxjs/toolkit';
import settingsReducer from './slices/settingsSlice';
import clientsReducer from './slices/clientsSlice';
import tasksReducer from './slices/tasksSlice';
import teamReducer from './slices/teamSlice';
import documentsReducer from './slices/documentsSlice';
import contentCalendarReducer from './slices/contentCalendarSlice';
import meetingNotesReducer from './slices/meetingNotesSlice';

export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    clients: clientsReducer,
    tasks: tasksReducer,
    team: teamReducer,
    documents: documentsReducer,
    contentCalendar: contentCalendarReducer,
    meetingNotes: meetingNotesReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});
