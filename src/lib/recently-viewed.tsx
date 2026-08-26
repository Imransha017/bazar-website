import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type RecentlyViewedItem = {
  id: string;
  viewed_at: number;
};

type RecentlyViewedContextType = {
  items: RecentlyViewedItem[];
  track: (productId: string) => void;
  clear: () => void;
};

const RecentlyViewedContext = createContext<RecentlyViewedContextType | null>(null);
const STORAGE_KEY = "bazar_recently_viewed_v1";
const MAX_ITEMS = 20;

export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setItems(JSON.parse(raw));
      }
    } catch (e) {
      console.error("Failed to load recently viewed items", e);
    }
  }, []);

  const track = (productId: string) => {
    setItems((prev) => {
      const filtered = prev.filter((item) => item.id !== productId);
      const newItem = { id: productId, viewed_at: Date.now() };
      const next = [newItem, ...filtered].slice(0, MAX_ITEMS);
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save recently viewed items", e);
      }
      
      return next;
    });
  };

  const clear = () => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <RecentlyViewedContext.Provider value={{ items, track, clear }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() {
  const context = useContext(RecentlyViewedContext);
  if (!context) {
    throw new Error("useRecentlyViewed must be used within a RecentlyViewedProvider");
  }
  return context;
}
