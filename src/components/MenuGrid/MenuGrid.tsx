"use client";

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '../ProductCard/ProductCard';
import ProductModal from '../ProductModal/ProductModal';
import { Product, Category } from '@/types';

interface MenuGridProps {
  categories: Category[];
  products: Product[];
}

export default function MenuGrid({ categories, products }: MenuGridProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const searchParams = useSearchParams();
  const selectedCategorySlug = searchParams.get('category');

  const filteredCategories = selectedCategorySlug
    ? categories.filter(c => c.slug === selectedCategorySlug)
    : categories;

  const handleOpenModal = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  return (
    <>
      <div className="container">
        {filteredCategories?.map((category) => {
          const categoryProducts = products?.filter(p => p.category_id === category.id) || [];
          
          if (categoryProducts.length === 0) return null;

          return (
            <section key={category.id} id={category.slug} style={{ marginBottom: '4rem', scrollMarginTop: '100px' }}>
              <h2 style={{ 
                fontSize: '2rem', 
                marginBottom: '1.5rem', 
                borderBottom: '2px solid var(--primary)',
                display: 'inline-block',
                paddingBottom: '0.5rem'
              }}>
                {category.name}
              </h2>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                gap: '2rem' 
              }}>
                {categoryProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onOpenModal={handleOpenModal} 
                  />
                ))}
              </div>
            </section>
          );
        })}

        {(!categories || categories.length === 0) && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>No se encontraron productos disponibles.</p>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>
              (Asegúrate de haber insertado los datos iniciales en Supabase)
            </p>
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductModal 
          product={selectedProduct} 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
        />
      )}
    </>
  );
}
