"use client";

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash, Save, X, ChefHat, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Product, Ingredient } from '@/types';
import styles from '../Dashboard.module.css';
import ProductForm from './ProductForm';
import IngredientForm from './IngredientForm';

interface InventoryTabProps {
  mode?: 'products' | 'ingredients';
}

export default function InventoryTab({ mode = 'products' }: InventoryTabProps) {
  const [products, setProducts] = useState<any[]>([]); // Changed to any to accommodate calculating costs dynamically
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isIngredientFormOpen, setIsIngredientFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null); // For editing products
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  
  // State for inline editing of ingredients
  const [editValues, setEditValues] = useState({
    unit: 'gramo',
    cost: '',
    stock: ''
  });

  useEffect(() => {
    fetchData();
  }, [mode]);

  const fetchData = async () => {
    if (mode === 'products') {
      // 1. Fetch Configs for Labor Calculation
      const { data: configData } = await supabase.from('configurations').select('*');
      const configs: Record<string, number> = {};
      if (configData) {
        configData.forEach(c => configs[c.key] = Number(c.value));
      }
      
      const laborLoad = 1 + 
        (configs['labor.social_security_pct'] || 0) + 
        (configs['labor.parafiscales_pct'] || 0) + 
        (configs['labor.benefits_pct'] || 0);
      const transportAid = configs['labor.transport_aid'] || 0;
      const dotacionYearly = configs['labor.dotacion_yearly'] || 0;

      // 2. Fetch Products with Relations
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_ingredients (
            quantity_needed,
            ingredients ( cost_per_unit )
          ),
          product_labor (
            qty_staff,
            base_salary
          ),
          product_expenses (
            qty_used,
            unit_cost
          )
        `)
        .order('name');
      
      if (error) console.error('Error fetching products:', error);

      if (data) {
        // 3. Calculate Cost per Unit
        const calculated = data.map((p: any) => {
           const unitsPerMonth = p.units_per_month || 1;

           // A. Materials (Per Unit * Units/Mes = Total Mat Monthly OR just Per Unit directly)
           // Logic: Material Cost = Sum(IngQty * IngCost) -> This is cost per ONE unit of product.
           const materialsCostPerUnit = p.product_ingredients?.reduce((sum: number, pi: any) => {
             const ingCost = pi.ingredients?.cost_per_unit || 0;
             return sum + (pi.quantity_needed * ingCost);
           }, 0) || 0;
           
           // B. Labor (Total Monthly)
           const laborTotalMonthly = p.product_labor?.reduce((sum: number, pl: any) => {
             const base = pl.base_salary * pl.qty_staff;
             const transport = transportAid * pl.qty_staff;
             const dotacion = (dotacionYearly * pl.qty_staff) / 12;
             const loadedSalary = base * laborLoad;
             return sum + loadedSalary + transport + dotacion;
           }, 0) || 0;

           // C. Expenses (Total Monthly)
           const expensesTotalMonthly = p.product_expenses?.reduce((sum: number, pe: any) => {
             return sum + (pe.qty_used * pe.unit_cost); // Assuming unit_cost is total for that qty or similar
           }, 0) || 0;

           // D. Grand Total Monthly
           const totalMonthlyProduction = (materialsCostPerUnit * unitsPerMonth) + laborTotalMonthly + expensesTotalMonthly;
           
           // E. Cost Per Unit
           const unitCost = totalMonthlyProduction / unitsPerMonth;

           return { ...p, calculated_cost: unitCost };
        });
        setProducts(calculated);
      }
    } else {
      const { data } = await supabase.from('ingredients').select('*').order('name');
      if (data) setIngredients(data);
    }
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

  const handleEditProduct = (id: string) => {
    setEditingProductId(id);
    setIsProductFormOpen(true);
  };

  const handleToggleVisibility = async (product: any) => {
    const newStatus = !product.is_available;
    const { error } = await supabase
      .from('products')
      .update({ is_available: newStatus })
      .eq('id', product.id);

    if (error) {
      alert('Error al actualizar visibilidad: ' + error.message);
    } else {
      // Optimistic update or refetch
      const updatedProducts = products.map(p => 
        p.id === product.id ? { ...p, is_available: newStatus } : p
      );
      setProducts(updatedProducts);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      {/* Products Column */}
      {mode === 'products' && (
      <div style={{ gridColumn: 'span 2' }}>
        <div className={styles.orderHeader}>
          <h2 className={styles.sectionTitle} style={{ margin: 0, border: 0 }}>Productos</h2>
          <button
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.9rem' }}
            onClick={() => {
              setEditingProductId(null);
              setIsProductFormOpen(true);
            }} 
          >
            <Plus size={16} style={{ marginRight: 8 }} /> Nuevo
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {products.map(product => (
            <div key={product.id} className={styles.orderCard} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img
                src={product.image_url || product.imageUrl || "https://via.placeholder.com/50"}
                alt={product.name}
                style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }}
              />
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{product.name}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <div style={{ color: '#666' }}>Costo: <span style={{ fontWeight: 'bold', color: '#333' }}>${Math.round(product.calculated_cost || 0).toLocaleString()}</span></div>
                    <div style={{ color: '#666' }}>Venta: <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>${product.price.toLocaleString()}</span></div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button 
                  className={styles.qtyBtn}
                  style={{ color: '#555', borderColor: '#ccc' }}
                  onClick={() => handleEditProduct(product.id)}
                  title="Editar"
                >
                  <Edit size={16} />
                </button>
                <button 
                  className={styles.qtyBtn} 
                  style={{ color: 'var(--error)', borderColor: 'var(--error)' }}
                  onClick={() => handleDeleteProduct(product.id)}
                  title="Eliminar"
                >
                  <Trash size={16} />
                </button>
                <button 
                  className={styles.qtyBtn} 
                  style={{ 
                    color: product.is_available ? 'green' : 'red', 
                    borderColor: product.is_available ? 'green' : 'red' 
                  }}
                  onClick={() => handleToggleVisibility(product)}
                  title={product.is_available ? "Visible (Click para ocultar)" : "Oculto (Click para mostrar)"}
                >
                  <Eye size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Ingredients Column */}
      {mode === 'ingredients' && (
      <div style={{ gridColumn: 'span 2' }}>
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
                      <option value="unidad">unidad</option>
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
      )}

      {isProductFormOpen && (
        <ProductForm
          onClose={() => setIsProductFormOpen(false)}
          onSuccess={fetchData}
          productId={editingProductId}
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
