"use client";


import { useState, useEffect } from 'react';
import { Plus, Edit, Trash, Save, X, ChefHat } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Product, Ingredient } from '@/types';
import styles from '../Dashboard.module.css';
import ProductForm from './ProductForm';

interface InventoryTabProps {
  mode?: 'products' | 'ingredients';
}

export default function InventoryTab({ mode = 'products' }: InventoryTabProps) {
  const [products, setProducts] = useState<any[]>([]); // Changed to any to accommodate calculating costs dynamically
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null); // For editing products
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [editCost, setEditCost] = useState('');
  
  // New state for adding ingredients
  const [newIngredientName, setNewIngredientName] = useState('');
  const [newIngredientUnit, setNewIngredientUnit] = useState('gramo');
  const [newIngredientCost, setNewIngredientCost] = useState('');
  const [showAddIngredient, setShowAddIngredient] = useState(false);

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

  const handleUpdateIngredientCost = async (id: string) => {
    await supabase.from('ingredients').update({ cost_per_unit: parseFloat(editCost) }).eq('id', id);
    setEditingIngredientId(null);
    fetchData();
  };
  
  const handleCreateIngredient = async () => {
    if (!newIngredientName || !newIngredientCost) return;
    const { error } = await supabase.from('ingredients').insert({
      name: newIngredientName,
      unit: newIngredientUnit,
      cost_per_unit: parseFloat(newIngredientCost),
      stock: 0
    });
    
    if (!error) {
      setNewIngredientName('');
      setNewIngredientCost('');
      setShowAddIngredient(false);
      fetchData();
    } else {
      alert('Error al crear ingrediente');
    }
  };

  const handleEditProduct = (id: string) => {
    setEditingProductId(id);
    setIsProductFormOpen(true);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      {/* Left Column: Products */}
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
            }} // New Product
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
                  className={styles.qtyBtn} // Reusing qtyBtn style for simplicity
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
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Ingredients Mode */}
      {mode === 'ingredients' && (
      <div style={{ gridColumn: 'span 2' }}>
        <div>
          <div className={styles.orderHeader}>
            <h2 className={styles.sectionTitle} style={{ margin: 0, border: 0 }}>Ingredientes</h2>
            <button 
              className="btn" 
              style={{ padding: '8px 16px', fontSize: '0.9rem', backgroundColor: '#f0f0f0' }}
              onClick={() => setShowAddIngredient(!showAddIngredient)}
            >
              <Plus size={16} style={{ marginRight: 8 }} /> Agregrar
            </button>
          </div>

          {showAddIngredient && (
            <div className={styles.orderCard} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid var(--primary)' }}>
              <h4>Nuevo Ingrediente</h4>
              <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input 
                  type="text" placeholder="Nombre" 
                  value={newIngredientName} onChange={e => setNewIngredientName(e.target.value)} 
                  className={styles.input} 
                />
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <select 
                    value={newIngredientUnit} 
                    onChange={e => setNewIngredientUnit(e.target.value)}
                    className={styles.input}
                  >
                    <option value="gramo">Gramo (g)</option>
                    <option value="mililitro">Mililitro (ml)</option>
                    <option value="unidad">Unidad (u)</option>
                  </select>
                  <input 
                    type="number" placeholder="Costo por unidad" 
                    value={newIngredientCost} onChange={e => setNewIngredientCost(e.target.value)} 
                    className={styles.input} 
                  />
                </div>
                <button className="btn btn-primary" onClick={handleCreateIngredient}>Guardar</button>
              </div>
            </div>
          )}

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
      </div>
      )}

      {isProductFormOpen && (
        <ProductForm 
          onClose={() => setIsProductFormOpen(false)} 
          onSuccess={fetchData}
          productId={editingProductId} // Pass product ID if editing
        />
      )}
    </div>
  );
}
