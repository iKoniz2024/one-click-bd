"use client";

import { useState, useEffect, useCallback } from "react";
import { CartContext } from "./cartContextValue";
import { getLocalCartCount } from "@/utils/localCart";

export function CartProvider({ children }) {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setCartCount(getLocalCartCount());
  }, []);

  const refetchCartCount = useCallback((count) => {
    setCartCount(count !== undefined ? count : getLocalCartCount());
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, refetchCartCount }}>
      {children}
    </CartContext.Provider>
  );
}

