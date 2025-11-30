"use client";

import { useState, useEffect } from 'react';
import { X, Plus, Trash } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Category, Ingredient } from '@/types';
import styles from '../Dashboard.module.css';

interface ProductFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProductForm({ onClose, onSuccess }: ProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  // Recipe State
  const [selectedIngredients, setSelectedIngredients] = useState<{
    ingredientId: string;
    quantity: string;
  }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [cats, ings] = await Promise.all([
        supabase.from('categories').select('*'),
        supabase.from('ingredients').select('*')
      ]);
      
      if (cats.data) setCategories(cats.data);
      if (ings.data) setIngredients(ings.data);
    };
    fetchData();
  }, []);

  const handleAddIngredient = () => {
    setSelectedIngredients([...selectedIngredients, { ingredientId: '', quantity: '' }]);
  };

  const handleUpdateIngredient = (index: number, field: 'ingredientId' | 'quantity', value: string) => {
    const newIngredients = [...selectedIngredients];
    // @ts-ignore
    newIngredients[index][field] = value;
    setSelectedIngredients(newIngredients);
  };

  const handleRemoveIngredient = (index: number) => {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create Product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name,
          description,
          price: parseFloat(price),
          category_id: categoryId,
          image_url: imageUrl
        })
        .select()
        .single();

      if (productError) throw productError;

      // 2. Create Product Ingredients (Recipe)
      if (selectedIngredients.length > 0) {
        const recipeData = selectedIngredients.map(item => ({
          product_id: product.id,
          ingredient_id: item.ingredientId,
          quantity_needed: parseFloat(item.quantity)
        }));

        const { error: recipeError } = await supabase
          .from('product_ingredients')
          .insert(recipeData);

        if (recipeError) throw recipeError;
      }

      alert('Producto creado exitosamente');
      onSuccess();
      onClose();
    } catch (error: any) {
      alert('Error al crear producto: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} style={{ maxWidth: '800px' }}>
        <div className={styles.modalHeader}>
          <h2>Nuevo Producto</h2>
          <button onClick={onClose}><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nombre</label>
              <input className={styles.input} value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Precio</label>
              <input type="number" className={styles.input} value={price} onChange={e => setPrice(e.target.value)} required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Categoría</label>
              <select className={styles.input} value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                <option value="">Seleccionar...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>URL Imagen</label>
              <input className={styles.input} value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Descripción</label>
            <textarea className={styles.input} value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          </div>

          <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3>Receta (Ingredientes)</h3>
              <button type="button" className="btn btn-outline" onClick={handleAddIngredient} style={{ padding: '4px 8px' }}>
                <Plus size={16} /> Agregar Ingrediente
              </button>
            </div>

            {selectedIngredients.map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                <select 
                  className={styles.input} 
                  value={item.ingredientId}
                  onChange={e => handleUpdateIngredient(index, 'ingredientId', e.target.value)}
                  required
                  style={{ flex: 2 }}
                >
                  <option value="">Seleccionar Ingrediente...</option>
                  {ingredients.map(ing => (
                    <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                  ))}
                </select>
                <input 
                  type="number" 
                  className={styles.input} 
                  placeholder="Cantidad"
                  value={item.quantity}
                  onChange={e => handleUpdateIngredient(index, 'quantity', e.target.value)}
                  required
                  style={{ flex: 1 }}
                />
                <button type="button" onClick={() => handleRemoveIngredient(index)} style={{ color: 'var(--error)' }}>
                  <Trash size={18} />
                </button>
              </div>
            ))}
          </div>

          <button type="submit" className={styles.saveBtn} disabled={loading} style={{ width: '100%', marginTop: '2rem' }}>
            {loading ? 'Guardando...' : 'Crear Producto'}
          </button>
        </form>
      </div>
    </div>
  );
}
