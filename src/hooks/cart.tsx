import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      // await AsyncStorage.clear();
      const productsData = await AsyncStorage.getItem(
        '@GoMarketplace:productsData',
      );

      if (productsData) {
        setProducts(JSON.parse(productsData));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productIndex = products.findIndex(
        productItem => productItem.id === product.id,
      );

      if (productIndex >= 0) {
        setProducts(
          products.map(p =>
            p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p,
          ),
        );
      } else {
        const productSave = { ...product, quantity: 1 };

        const productsOrdered = [...products, productSave].sort((a, b) => {
          if (a.title < b.title) {
            return -1;
          }
          if (a.title > b.title) {
            return 1;
          }
          return 0;
        });
        setProducts(productsOrdered);
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:productsData',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      setProducts(
        products.map(p =>
          p.id === id ? { ...p, quantity: p.quantity + 1 } : p,
        ),
      );
      await AsyncStorage.setItem(
        '@GoMarketplace:productsData',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productFind = products.find(product => product.id === id);
      if (productFind?.quantity === 1) {
        setProducts(products.filter(product => product.id !== id));
      } else {
        setProducts(
          products.map(p =>
            p.id === id ? { ...p, quantity: p.quantity - 1 } : p,
          ),
        );
      }
      await AsyncStorage.setItem(
        '@GoMarketplace:productsData',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
