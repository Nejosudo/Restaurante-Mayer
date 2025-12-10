"use client";

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Product, Ingredient } from '@/types';
import styles from '../Dashboard.module.css';
import ProductForm from './ProductForm';
import IngredientForm from './IngredientForm';

export default function InventoryTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isIngredientFormOpen, setIsIngredientFormOpen] = useState(false);
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ unit: '', cost: '', stock: '' });

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

  const handleDeleteIngredient = async (id: string) => {
    if (!confirm('¿Eliminar ingrediente? Esta acción podría afectar a los productos que lo utilizan.')) return;
    const { error } = await supabase.from('ingredients').delete().eq('id', id);

    if (error) {
      alert('Error al eliminar ingrediente: ' + error.message);
    } else {
      fetchData();
    }
  };

  const handleUpdateIngredient = async (id: string) => {
    const updates = {
      unit: editValues.unit,
      cost_per_unit: parseFloat(editValues.cost),
      stock: parseFloat(editValues.stock)
    };

    const { error } = await supabase.from('ingredients').update(updates).eq('id', id);

    if (error) {
      alert('Error al actualizar: ' + error.message);
    } else {
      setEditingIngredientId(null);
      fetchData();
    }
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
          <button
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.9rem' }}
            onClick={() => setIsIngredientFormOpen(true)}
          >
            <Plus size={16} style={{ marginRight: 8 }} /> Nuevo
          </button>
        </div>

        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {ingredients.map(ing => (
            <div key={ing.id} className={styles.orderCard} style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              {editingIngredientId === ing.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 600, marginRight: 'auto' }}>{ing.name}</div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <label style={{ fontSize: '0.7rem', color: '#666' }}>Unidad</label>
                    <select
                      value={editValues.unit}
                      onChange={e => setEditValues({ ...editValues, unit: e.target.value })}
                      style={{ width: '80px', padding: '4px', border: '1px solid #ddd', borderRadius: '4px' }}
                    >
                      <option value="gramo">gramo</option>
                      <option value="mililitro">mililitro</option>
                      {/* <option value="kilo">kilogramo</option> */}
                      {/* <option value="litro">litro</option> */}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <label style={{ fontSize: '0.7rem', color: '#666' }}>Costo</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editValues.cost}
                      onChange={e => setEditValues({ ...editValues, cost: e.target.value })}
                      style={{ width: '70px', padding: '4px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <label style={{ fontSize: '0.7rem', color: '#666' }}>Stock</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editValues.stock}
                      onChange={e => setEditValues({ ...editValues, stock: e.target.value })}
                      style={{ width: '70px', padding: '4px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
                    <button onClick={() => handleUpdateIngredient(ing.id)} style={{ color: 'green' }} title="Guardar"><Save size={18} /></button>
                    <button onClick={() => setEditingIngredientId(null)} style={{ color: 'red' }} title="Cancelar"><X size={18} /></button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <div style={{ fontWeight: 600 }}>{ing.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      Unidad: {ing.unit} | Stock: <span style={{ color: ing.stock < 10 ? 'var(--error)' : 'inherit', fontWeight: 'bold' }}>{ing.stock}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontWeight: 'bold' }}>${ing.cost_per_unit.toLocaleString()}</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          setEditingIngredientId(ing.id);
                          setEditValues({
                            unit: ing.unit,
                            cost: ing.cost_per_unit.toString(),
                            stock: ing.stock.toString()
                          });
                        }}
                        style={{ color: '#666' }}
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteIngredient(ing.id)}
                        style={{ color: 'var(--error)' }}
                        title="Eliminar"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                </>
              )}
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

      {isIngredientFormOpen && (
        <IngredientForm
          onClose={() => setIsIngredientFormOpen(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
