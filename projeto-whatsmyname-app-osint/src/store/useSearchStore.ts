import { create } from 'zustand';

interface SearchState {
  query: string;
  isSearching: boolean;
  progress: number;
  results: any[];
  setQuery: (query: string) => void;
  setIsSearching: (isSearching: boolean) => void;
  setProgress: (progress: number) => void;
  addResult: (result: any) => void;
  resetSearch: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  isSearching: false,
  progress: 0,
  results: [],
  setQuery: (query) => set({ query }),
  setIsSearching: (isSearching) => set({ isSearching }),
  setProgress: (progress) => set({ progress }),
  addResult: (result) => set((state) => ({ results: [...state.results, result] })),
  resetSearch: () => set({ isSearching: false, progress: 0, results: [] }),
}));
