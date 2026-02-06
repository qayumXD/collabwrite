import create from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
    persist(
        (set) => ({
            user: null,
            token: null,
            documents: [],
            login: (token, user) => set({ token, user }),
            logout: () => set({ token: null, user: null }),
            setDocuments: (documents) => set({ documents }),
            addDocument: (document) => set((state) => ({ documents: [...state.documents, document] })),
        }),
        {
            name: 'auth-storage', // name of the item in the storage (must be unique)
            getStorage: () => localStorage, // (optional) by default, 'localStorage' is used
        }
    )
);

export default useStore;
