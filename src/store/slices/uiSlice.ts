import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  activePanel: string | null;
  showStats: boolean;
  showGridHelper: boolean;
  showAxesHelper: boolean;
}

const initialState: UIState = {
  theme: 'dark',
  sidebarCollapsed: false,
  activePanel: 'materials',
  showStats: false,
  showGridHelper: true,
  showAxesHelper: false
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setActivePanel: (state, action: PayloadAction<string | null>) => {
      state.activePanel = action.payload;
    },
    toggleStats: (state) => {
      state.showStats = !state.showStats;
    },
    toggleGridHelper: (state) => {
      state.showGridHelper = !state.showGridHelper;
    },
    toggleAxesHelper: (state) => {
      state.showAxesHelper = !state.showAxesHelper;
    }
  }
});

export const { setTheme, toggleSidebar, setActivePanel, toggleStats, toggleGridHelper, toggleAxesHelper } = uiSlice.actions;
export type { UIState };
export default uiSlice.reducer;
