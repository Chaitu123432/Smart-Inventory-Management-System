// @ts-nocheck
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// ✅ Centralized base URL
const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:3001/api/products';


// ✅ Axios instance (replaces productsAPI)
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  price: number;
  stock: number;
  quantity: number;
  supplier?: string;
  reorderLevel?: number;
  minStockLevel?: number;
  location?: string;
  description?: string;
  status?: string;
}

interface InventoryContextType {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(
  undefined
);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching products from API...');
      const response = await api.get('/');
      console.log('API response:', response.data);

      const data = response.data.products || response.data;

      if (Array.isArray(data)) {
        const productsWithNumbers = data.map((product: any) => ({
          ...product,
          price: product.price ? parseFloat(product.price) : 0,
          quantity: product.quantity ? parseInt(product.quantity) : 0,
        }));
        setProducts(productsWithNumbers);
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (apiError) {
      console.warn('Falling back to dummy product data:', apiError);
      if (products.length === 0) {
        setProducts([
          {
            id: '1',
            name: 'Wireless Keyboard',
            category: 'Accessories',
            price: 59.99,
            stock: 45,
            quantity: 45,
            supplier: 'Tech Supplies Inc',
            reorderLevel: 10,
            minStockLevel: 10,
          },
          {
            id: '2',
            name: 'Gaming Mouse',
            category: 'Accessories',
            price: 89.99,
            stock: 32,
            quantity: 32,
            supplier: 'Gaming Gear Co.',
            reorderLevel: 8,
            minStockLevel: 8,
          },
          {
            id: '3',
            name: 'USB-C Dock',
            category: 'Accessories',
            price: 129.99,
            stock: 18,
            quantity: 18,
            supplier: 'Tech Supplies Inc',
            reorderLevel: 5,
            minStockLevel: 5,
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addProduct = async (productData) => {
    setIsLoading(true);
    try {
      console.log('Adding product:', productData);
      const response = await api.post('/', productData);
      const newProduct = response.data.product || productData;
      setProducts((prev) => [
        ...prev,
        { ...newProduct, stock: newProduct.quantity || 0 },
      ]);
    } catch (apiError) {
      console.warn('Could not create product via API:', apiError);
      const tempId = `temp-${Date.now()}`;
      setProducts((prev) => [
        ...prev,
        { id: tempId, ...productData, stock: productData.quantity || 0 },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProduct = async (id, productData) => {
    setIsLoading(true);
    try {
      await api.put(`/${id}`, productData);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, ...productData, stock: productData.quantity || p.quantity }
            : p
        )
      );
    } catch (apiError) {
      console.warn('Could not update product via API:', apiError);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, ...productData, stock: productData.quantity || p.quantity }
            : p
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    setIsLoading(true);
    try {
      await api.delete(`/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (apiError) {
      console.warn('Could not delete product via API:', apiError);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    products,
    isLoading,
    error,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

export default InventoryContext;
