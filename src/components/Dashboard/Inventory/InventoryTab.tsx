"use client";

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Product, Ingredient } from '@/types';
import styles from '../Dashboard.module.css';
import ProductForm from './ProductForm';

export default function InventoryTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [editCost, setEditCost] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [prods, ings] = await Promise.all([
      supabase.from('products').select('*').order('name'),
      supabase.from('ingredients').select('*').order('name')
    ]);
    
    if (prods.data) setProducts(prods.data);
    if (ings.data) setIngredients(ings.data);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('¿Eliminar producto?')) return;
    await supabase.from('products').delete().eq('id', id);
    fetchData();
  };

  const handleUpdateIngredientCost = async (id: string) => {
    await supabase.from('ingredients').update({ cost_per_unit: parseFloat(editCost) }).eq('id', id);
    setEditingIngredientId(null);
    fetchData();
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      {/* Left Column: Products */}
      <div>
        <div className={styles.orderHeader}>
          <h2 className={styles.sectionTitle} style={{ margin: 0, border: 0 }}>Productos</h2>
          <button 
            className="btn btn-primary" 
            style={{ padding: '8px 16px', fontSize: '0.9rem' }}
            onClick={() => setIsProductFormOpen(true)}
          >
            <Plus size={16} style={{ marginRight: 8 }} /> Nuevo
          </button>
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {products.map(product => (
            <div key={product.id} className={styles.orderCard} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img 
                src={product.image_url || product.imageUrl || "https://via.placeholder.com/50"} 
                alt={product.name}
                style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }}
              />
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0 }}>{product.name}</h4>
                <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>${product.price.toLocaleString()}</span>
              </div>
              <button 
                className={styles.qtyBtn} 
                style={{ color: 'var(--error)', borderColor: 'var(--error)' }}
                onClick={() => handleDeleteProduct(product.id)}
              >
                <Trash size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Ingredients */}
      <div>
        <div className={styles.orderHeader}>
          <h2 className={styles.sectionTitle} style={{ margin: 0, border: 0 }}>Ingredientes</h2>
        </div>

        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {ingredients.map(ing => (
            <div key={ing.id} className={styles.orderCard} style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{ing.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>Unidad: {ing.unit}</div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {editingIngredientId === ing.id ? (
                  <>
                    <input 
                      type="number" 
                      value={editCost} 
                      onChange={e => setEditCost(e.target.value)}
                      style={{ width: '80px', padding: '4px' }}
                      autoFocus
                    />
                    <button onClick={() => handleUpdateIngredientCost(ing.id)} style={{ color: 'green' }}><Save size={16} /></button>
                    <button onClick={() => setEditingIngredientId(null)} style={{ color: 'red' }}><X size={16} /></button>
                  </>
                ) : (
                  <>
                    <span style={{ fontWeight: 'bold' }}>${ing.cost_per_unit.toLocaleString()}</span>
                    <button 
                      onClick={() => {
                        setEditingIngredientId(ing.id);
                        setEditCost(ing.cost_per_unit.toString());
                      }}
                      style={{ color: '#666' }}
                    >
                      <Edit size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isProductFormOpen && (
        <ProductForm 
          onClose={() => setIsProductFormOpen(false)} 
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
