// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout/Layout';
// @ts-ignore
import { useTable, useSortBy, useGlobalFilter, usePagination } from 'react-table';
import { useInventory } from '../contexts/InventoryContext';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

// Add proper types for react-table
type TableColumn = {
  Header: string;
  accessor?: string;
  id?: string;
  Cell?: any;
  getSortByToggleProps?: () => any;
  isSorted?: boolean;
  isSortedDesc?: boolean;
}

const InventoryPage: React.FC = () => {
  const { products, isLoading, error, fetchProducts, addProduct, updateProduct, deleteProduct } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    stock: '',
    price: '',
    supplier: '',
    reorderLevel: '',
    description: '',
    location: '',
    imageUrl: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (error) {
      setErrorMessage(error);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  }, [error]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      // Form validation
      if (!formData.name || !formData.category || !formData.price || !formData.stock) {
        setErrorMessage('Please fill in all required fields');
        return;
      }

      const newProduct = {
        name: formData.name,
        sku: formData.sku || `SKU-${Date.now()}`,
        category: formData.category,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.stock),
        minStockLevel: parseInt(formData.reorderLevel) || 0,
        supplier: formData.supplier || '',
        description: formData.description || ''
      };
      
      await addProduct(newProduct);

      // Reset form and close modal
      setFormData({
        name: '',
        sku: '',
        category: '',
        price: '',
        stock: '',
        supplier: '',
        reorderLevel: '',
        description: '',
        location: '',
        imageUrl: ''
      });
      setIsAddModalOpen(false);
      setSuccessMessage('Product added successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error adding product:', error);
      setErrorMessage('Failed to add product');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleEditStart = (product) => {
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString() || product.quantity.toString(),
      supplier: product.supplier || '',
      reorderLevel: product.reorderLevel?.toString() || '',
      description: product.description || '',
      location: product.location || '',
      imageUrl: product.imageUrl || ''
    });
    setIsEditing(true);
    setEditingId(product.id);
    setIsAddModalOpen(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      // Form validation
      if (!formData.name || !formData.category || !formData.price || !formData.stock) {
        setErrorMessage('Please fill in all required fields');
        return;
      }

      const updatedProduct = {
        id: editingId,
        name: formData.name,
        sku: formData.sku || `SKU-${Date.now()}`,
        category: formData.category,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.stock),
        minStockLevel: parseInt(formData.reorderLevel) || 0,
        supplier: formData.supplier || '',
        description: formData.description || '',
        location: formData.location || '',
        imageUrl: formData.imageUrl || ''
      };

      await updateProduct(editingId, updatedProduct);

      // Reset form and close modal
      setFormData({
        name: '',
        sku: '',
        category: '',
        price: '',
        stock: '',
        supplier: '',
        reorderLevel: '',
        description: '',
        location: '',
        imageUrl: ''
      });
      setIsEditing(false);
      setEditingId(null);
      setIsAddModalOpen(false);
      setSuccessMessage('Product updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating product:', error);
      setErrorMessage('Failed to update product');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await deleteProduct(id);
      setSuccessMessage('Product deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting product:', error);
      setErrorMessage('Failed to delete product');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'quantity' || name === 'price' ? parseFloat(value) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedProduct) {
        // Update existing product
        const updatedProduct = {
          id: selectedProduct.id,
          ...formData,
          quantity: parseInt(formData.stock),
          status: parseInt(formData.stock) === 0 
            ? 'Out of Stock' 
            : parseInt(formData.stock) <= 5 
            ? 'Low Stock' 
            : 'In Stock'
        };
        
        await updateProduct(selectedProduct.id, updatedProduct);
      } else {
        // Add new product
        const newProduct = {
          ...formData,
          quantity: parseInt(formData.stock),
          status: parseInt(formData.stock) === 0 
            ? 'Out of Stock' 
            : parseInt(formData.stock) <= 5 
            ? 'Low Stock' 
            : 'In Stock'
        };
        
        await addProduct(newProduct);
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const data = useMemo(() => products, [products]);
  
  const columns = useMemo(
    () => [
      {
        Header: 'Product Name',
        accessor: 'name',
      },
      {
        Header: 'SKU',
        accessor: 'sku',
      },
      {
        Header: 'Category',
        accessor: 'category',
      },
      {
        Header: 'Quantity',
        accessor: row => row.quantity || row.stock || 0,
        id: 'quantity',
      },
      {
        Header: 'Price',
        accessor: 'price',
        Cell: ({ value }: { value: number | string }) => {
          // Convert string to number if needed (PostgreSQL DECIMAL returns as string)
          const price = typeof value === 'string' ? parseFloat(value) : value;
          return `$${price ? price.toFixed(2) : '0.00'}`;
        },
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ value }: { value: string }) => {
          let statusColor = '';
          switch (value) {
            case 'In Stock':
              statusColor = 'bg-green-100 text-green-800';
              break;
            case 'Low Stock':
              statusColor = 'bg-yellow-100 text-yellow-800';
              break;
            case 'Out of Stock':
              statusColor = 'bg-red-100 text-red-800';
              break;
            default:
              statusColor = 'bg-gray-100 text-gray-800';
          }
          return (
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
              {value}
            </span>
          );
        },
      },
      {
        Header: 'Actions',
        id: 'actions',
        Cell: ({ row }: { row: { original: Product } }) => (
          <div className="flex space-x-2">
            <button
              onClick={() => handleEditStart(row.original)}
              className="text-blue-600 hover:text-blue-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </button>
            <button
              onClick={() => handleDeleteProduct(row.original.id)}
              className="text-red-600 hover:text-red-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    setGlobalFilter,
    state: { pageIndex, pageSize, globalFilter },
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0, pageSize: 10 },
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  if (isLoading) {
    return (
      <Layout title="Inventory">
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Inventory">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Inventory Management</h1>
        <button
          onClick={() => {
            setFormData({
              name: '',
              sku: '',
              category: '',
              stock: '',
              price: '',
              supplier: '',
              reorderLevel: '',
              description: '',
              location: '',
              imageUrl: ''
            });
            setIsEditing(false);
            setEditingId(null);
            setIsAddModalOpen(true);
          }}
          className="btn-primary"
        >
          Add New Product
        </button>
      </div>

      {/* Success/Error messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {errorMessage}
        </div>
      )}

      {/* Loading indicator */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="mb-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
              <button 
                onClick={() => setGlobalFilter(searchTerm)} 
                className="px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
              >
                Search
              </button>
            </div>
          </div>
        
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <div className="align-middle inline-block min-w-full">
              <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table {...getTableProps()} className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    {headerGroups.map(headerGroup => (
                      <tr {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map(column => (
                          <th
                            {...column.getHeaderProps(column.getSortByToggleProps())}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {column.render('Header')}
                            <span>
                              {column.isSorted
                                ? column.isSortedDesc
                                  ? ' 🔽'
                                  : ' 🔼'
                                : ''}
                            </span>
                          </th>
                        ))}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    ))}
                  </thead>
                  <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-200">
                    {page.map(row => {
                      prepareRow(row);
                      return (
                        <tr {...row.getRowProps()}>
                          {row.cells.map(cell => (
                            <td {...cell.getCellProps()} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {cell.render('Cell')}
                            </td>
                          ))}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => handleEditStart(row.original)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(row.original.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pagination */}
          <div className="py-3 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => previousPage()}
                disabled={!canPreviousPage}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white ${
                  !canPreviousPage ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => nextPage()}
                disabled={!canNextPage}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white ${
                  !canNextPage ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{pageIndex * pageSize + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min((pageIndex + 1) * pageSize, products.length)}
                  </span>{' '}
                  of <span className="font-medium">{products.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => previousPage()}
                    disabled={!canPreviousPage}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 ${
                      !canPreviousPage ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {pageOptions.map((page, index) => (
                    <button
                      key={index}
                      onClick={() => gotoPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                        pageIndex === page
                          ? 'z-10 bg-primary text-white border-primary hover:bg-primary-dark'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => nextPage()}
                    disabled={!canNextPage}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 ${
                      !canNextPage ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Product Form Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'Edit Product' : 'Add New Product'}
            </h2>
            
            <form onSubmit={editingId ? handleUpdateProduct : handleAddProduct}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Product Name*
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="input-field mt-1"
                  />
                </div>
                
                <div>
                  <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                    SKU*
                  </label>
                  <input
                    type="text"
                    id="sku"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    required
                    className="input-field mt-1"
                  />
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category*
                  </label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="input-field mt-1"
                  />
                </div>
                
                <div>
                  <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
                    Quantity*
                  </label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    min="0"
                    required
                    className="input-field mt-1"
                  />
                </div>
                
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Price ($)*
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                    className="input-field mt-1"
                  />
                </div>
                
                <div>
                  <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">
                    Supplier
                  </label>
                  <input
                    type="text"
                    id="supplier"
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleInputChange}
                    className="input-field mt-1"
                  />
                </div>
                
                <div>
                  <label htmlFor="reorderLevel" className="block text-sm font-medium text-gray-700">
                    Reorder Level
                  </label>
                  <input
                    type="number"
                    id="reorderLevel"
                    name="reorderLevel"
                    value={formData.reorderLevel}
                    onChange={handleInputChange}
                    min="0"
                    className="input-field mt-1"
                  />
                </div>
                
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="input-field mt-1"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="input-field mt-1"
                    rows="3"
                  ></textarea>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingId ? 'Update' : 'Add'} Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default InventoryPage; 