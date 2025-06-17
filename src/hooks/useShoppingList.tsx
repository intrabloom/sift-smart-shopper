
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

  useEffect(() => {
    const savedList = JSON.parse(localStorage.getItem("shopping_list") || "[]");
    setItems(savedList);
  }, []);

  const addItem = (item: Omit<ShoppingListItem, 'id' | 'addedAt'>) => {
    const newItem: ShoppingListItem = {
      ...item,
      id: Date.now(),
      addedAt: new Date().toISOString(),
      checked: false
    };
    
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    localStorage.setItem("shopping_list", JSON.stringify(updatedItems));
    return newItem;
  };

  const removeItem = (id: number) => {
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    localStorage.setItem("shopping_list", JSON.stringify(updatedItems));
  };

  const toggleItem = (id: number) => {
    const updatedItems = items.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setItems(updatedItems);
    localStorage.setItem("shopping_list", JSON.stringify(updatedItems));
  };

  const clearList = () => {
    setItems([]);
    localStorage.removeItem("shopping_list");
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
    addItem,
    removeItem,
    toggleItem,
    clearList,
    getOptimizedRoute,
    getTotalCost,
    getItemsByStore
  };
};
