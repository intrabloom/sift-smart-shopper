
import { useState, useEffect } from 'react';
import { useStoreRoster } from './useStoreRoster';
import { useAuth } from './useAuth';

export interface ShoppingListItem {
  id: number;
  productId: string;
  productName: string;
  store: string;
  storeId?: string;
  price: number;
  addedAt: string;
  checked?: boolean;
}

export interface OptimizedRoute {
  store: string;
  storeId: string;
  items: ShoppingListItem[];
  subtotal: number;
  estimatedTime: string;
  distance: string;
  rosterOrder: number;
}

export const useShoppingList = () => {
  const { user } = useAuth();
  const { roster } = useStoreRoster();
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load items from localStorage on mount
  useEffect(() => {
    try {
      const savedList = localStorage.getItem("shopping_list");
      if (savedList) {
        const parsedList = JSON.parse(savedList);
        console.log('Loading shopping list from localStorage:', parsedList);
        setItems(Array.isArray(parsedList) ? parsedList : []);
      }
    } catch (error) {
      console.error('Error loading shopping list from localStorage:', error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save items to localStorage whenever items change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem("shopping_list", JSON.stringify(items));
        console.log('Saved shopping list to localStorage:', items);
      } catch (error) {
        console.error('Error saving shopping list to localStorage:', error);
      }
    }
  }, [items, isLoading]);

  const addItem = (item: Omit<ShoppingListItem, 'id' | 'addedAt'>) => {
    console.log('Adding item to shopping list:', item);
    
    // Check if item already exists
    const existingItem = items.find(existingItem => 
      existingItem.productId === item.productId && existingItem.store === item.store
    );
    
    if (existingItem) {
      console.log('Item already exists in shopping list');
      return existingItem;
    }
    
    const newItem: ShoppingListItem = {
      ...item,
      id: Date.now() + Math.random(), // More unique ID
      addedAt: new Date().toISOString(),
      checked: false
    };
    
    setItems(prevItems => {
      const updatedItems = [...prevItems, newItem];
      console.log('Updated shopping list items:', updatedItems);
      return updatedItems;
    });
    
    return newItem;
  };

  const removeItem = (id: number) => {
    console.log('Removing item from shopping list:', id);
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const toggleItem = (id: number) => {
    console.log('Toggling item in shopping list:', id);
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const clearList = () => {
    console.log('Clearing shopping list');
    setItems([]);
  };

  const getOptimizedRoute = (): OptimizedRoute[] => {
    // Group items by store
    const storeGroups: { [store: string]: ShoppingListItem[] } = {};
    items.forEach(item => {
      if (!storeGroups[item.store]) {
        storeGroups[item.store] = [];
      }
      storeGroups[item.store].push(item);
    });

    // Create route stops with roster order priority
    const routeStops: OptimizedRoute[] = Object.entries(storeGroups).map(([storeName, storeItems]) => {
      // Find store in roster to get preference order
      const rosterItem = roster.find(r => r.store.name === storeName);
      const rosterOrder = rosterItem ? rosterItem.preference_order : 999;
      
      return {
        store: storeName,
        storeId: rosterItem?.store_id || '',
        items: storeItems,
        subtotal: storeItems.reduce((sum, item) => sum + item.price, 0),
        estimatedTime: `${Math.max(10, storeItems.length * 2)} min`,
        distance: `${(0.5 + Math.random() * 2).toFixed(1)} mi`,
        rosterOrder
      };
    });

    // Sort by roster preference order (lowest first), then by distance
    return routeStops.sort((a, b) => {
      if (a.rosterOrder !== b.rosterOrder) {
        return a.rosterOrder - b.rosterOrder;
      }
      return parseFloat(a.distance) - parseFloat(b.distance);
    });
  };

  const getTotalCost = () => {
    return items.reduce((total, item) => total + item.price, 0);
  };

  const getItemsByStore = () => {
    const groups: { [store: string]: ShoppingListItem[] } = {};
    items.forEach(item => {
      if (!groups[item.store]) {
        groups[item.store] = [];
      }
      groups[item.store].push(item);
    });
    return groups;
  };

  return {
    items,
    isLoading,
    addItem,
    removeItem,
    toggleItem,
    clearList,
    getOptimizedRoute,
    getTotalCost,
    getItemsByStore
  };
};
