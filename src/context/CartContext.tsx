"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/types';

export interface CartItem {
  cartItemId: string; // Unique ID for this specific entry (product + note combination)
  product: Product;
  quantity: number;
  note: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity: number, note: string) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  count: number;
  isCartOpen: boolean;
  toggleCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to load cart", e);
      }
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, quantity: number, note: string) => {
    setItems(prev => {
      // Check if item with same product ID and same note exists
      const existingItemIndex = prev.findIndex(
        item => item.product.id === product.id && item.note === note
      );

      if (existingItemIndex >= 0) {
        const newItems = [...prev];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + quantity
        };
        return newItems;
      }

      return [...prev, {
        cartItemId: `${product.id}-${Date.now()}`,
        product,
        quantity,
        note
      }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setItems(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity < 1) return;
    setItems(prev => prev.map(item => 
      item.cartItemId === cartItemId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
    setItems([]);
  };

  const toggleCart = () => setIsCartOpen(prev => !prev);

  const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      total,
      count,
      isCartOpen,
      toggleCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
