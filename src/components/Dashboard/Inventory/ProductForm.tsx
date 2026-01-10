"use client";

import { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash, Calculator, Save, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Category, Ingredient, Configuration } from '@/types';
import styles from '../Dashboard.module.css';

interface ProductFormProps {
  onClose: () => void;
  onSuccess: () => void;
  productId?: string | null; // Optional product ID for editing
}

export default function ProductForm({ onClose, onSuccess, productId }: ProductFormProps) {
  const [activeSection, setActiveSection] = useState<'info'|'labor'|'materials'|'expenses'>('info');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [configs, setConfigs] = useState<Record<string, any>>({});
  
  // -- 1. Basic Info --
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [unitsPerMonth, setUnitsPerMonth] = useState<string>('1');
  const [daysPerMonth, setDaysPerMonth] = useState<string>('26');

  // -- 2. Direct Labor --
  const [laborRows, setLaborRows] = useState<{ role: string, qty: number, salary: number }[]>([]);

  // -- 3. Raw Materials --
  const [materialRows, setMaterialRows] = useState<{ ingredientId: string, qty: number }[]>([]);

  // -- 4. Mfg Expenses --
  // sourceKey is optional: if present and !== 'custom', it links to a config
  const [expenseRows, setExpenseRows] = useState<{ type: string, unit: string, qty: number, cost: number, sourceKey?: string }[]>([]);

  // -- 5. Pricing --
  const [salePrice, setSalePrice] = useState<string>('0');

  // -- 6. Duplicate Handling --
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateNames, setDuplicateNames] = useState<string[]>([]);
  
  // -- 7. Configs for Selection --
  const [manufacturingOptions, setManufacturingOptions] = useState<Configuration[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch all necessary data: Global configs, Categories, Ingredients
  // AND if editing, the specific product details
  const fetchInitialData = async () => {
    const [cats, ings, confs] = await Promise.all([
      supabase.from('categories').select('*'),
      supabase.from('ingredients').select('*'),
      supabase.from('configurations').select('*')
    ]);
    
    if (cats.data) setCategories(cats.data);
    if (ings.data) setIngredients(ings.data);
    if (confs.data) {
      const configMap: any = {};
      confs.data.forEach(c => configMap[c.key] = c.value);
      setConfigs(configMap);
      
      // Filter for dropdown options
      const mfg = confs.data.filter(c => c.category === 'manufacturing');
      setManufacturingOptions(mfg);
    }

    // IF EDITING: Fetch detailed product data
    if (productId) {
      const { data: prod } = await supabase
        .from('products')
        .select(`
          *,
          product_ingredients ( ingredient_id, quantity_needed ),
          product_labor ( role_name, qty_staff, base_salary ),
          product_expenses ( expense_type, unit, qty_used, unit_cost )
        `)
        .eq('id', productId)
        .single();
      
      if (prod) {
        setName(prod.name);
        setDescription(prod.description || '');
        setSalePrice(String(prod.price || 0));
        setCategoryId(prod.category_id || '');
        setImageUrl(prod.image_url || '');
        setUnitsPerMonth(String(prod.units_per_month || 1));
        setDaysPerMonth(String(prod.days_per_month || 26));

        // Map sub-tables to state
        if (prod.product_labor) {
            setLaborRows(prod.product_labor.map((l: any) => ({
                role: l.role_name,
                qty: l.qty_staff,
                salary: l.base_salary
            })));
        }
        if (prod.product_ingredients) {
            setMaterialRows(prod.product_ingredients.map((i: any) => ({
                ingredientId: i.ingredient_id,
                qty: i.quantity_needed
            })));
        }
        if (prod.product_expenses) {
            // Try to match existing expenses to configs to restore state
            const mfgConfigs = confs.data?.filter((c:any) => c.category === 'manufacturing') || [];
            
            setExpenseRows(prod.product_expenses.map((e: any) => {
                const matched = mfgConfigs.find((c:any) => c.label === e.expense_type);
                return {
                    type: e.expense_type,
                    unit: e.unit,
                    qty: e.qty_used,
                    cost: e.unit_cost,
                    sourceKey: matched ? matched.key : 'custom'
                };
            }));
        }
      }
    }
  };

  const inferUnit = (key: string) => {
    const k = key.toLowerCase();
    if (k.includes('luz') || k.includes('energ') || k.includes('elect')) return 'Kwh';
    if (k.includes('agua') || k.includes('water') || k.includes('acue')) return 'm3';
    if (k.includes('gas')) return 'm3';
    return '';
  };

  // --- CALCULATIONS ---
  // 1. Labor Calculation
  const laborCosts = useMemo(() => {
    const minWage = Number(configs['labor.min_wage'] || 0);
    const transportAid = Number(configs['labor.transport_aid'] || 0);
    const socialSecPct = Number(configs['labor.social_security_pct'] || 0);
    const parafiscalesPct = Number(configs['labor.parafiscales_pct'] || 0);
    const benefitsPct = Number(configs['labor.benefits_pct'] || 0);
    const dotacionYearly = Number(configs['labor.dotacion_yearly'] || 0);

    return laborRows.map(row => {
      const baseMonthly = row.salary * row.qty;
      const transport = transportAid * row.qty; 
      const modularSubtotal = baseMonthly + transport;
      
      const socialSec = baseMonthly * socialSecPct;
      const parafiscales = baseMonthly * parafiscalesPct;
      const benefits = baseMonthly * benefitsPct;
      const dotacionMonthly = (dotacionYearly * row.qty) / 12;

      const totalMonthly = modularSubtotal + socialSec + parafiscales + benefits + dotacionMonthly;
      return { ...row, totalMonthly };
    });
  }, [laborRows, configs]);

  const totalLaborMonthly = laborCosts.reduce((sum, r) => sum + r.totalMonthly, 0);

  // 2. Materials Calculation
  const materialCosts = useMemo(() => {
    return materialRows.map(row => {
      const ing = ingredients.find(i => i.id === row.ingredientId);
      const unitCost = ing?.cost_per_unit || 0;
      const totalMonthly = row.qty * Number(unitsPerMonth || 0) * unitCost;
      return { 
        ...row, 
        name: ing?.name, 
        unitName: ing?.unit, 
        unitCost, 
        totalMonthly 
      };
    });
  }, [materialRows, ingredients, unitsPerMonth]);

  const totalMaterialsMonthly = materialCosts.reduce((sum, r) => sum + r.totalMonthly, 0);

  // 3. Expenses Calculation
  const expenseCosts = useMemo(() => {
    return expenseRows.map(row => {
      const totalMonthly = row.qty * row.cost; 
      return { ...row, totalMonthly };
    });
  }, [expenseRows]);

  const totalExpensesMonthly = expenseCosts.reduce((sum, r) => sum + r.totalMonthly, 0);

  // 4. Grand Totals
  const totalProductionCostMonthly = totalLaborMonthly + totalMaterialsMonthly + totalExpensesMonthly;
  const unitCost = Number(unitsPerMonth || 0) > 0 ? totalProductionCostMonthly / Number(unitsPerMonth || 1) : 0;
  const margin = Number(salePrice || 0) > 0 ? ((Number(salePrice || 0) - unitCost) / Number(salePrice || 1)) * 100 : 0;

  // --- HANDLERS ---
  // --- HANDLERS ---
  const handleSubmit = async (e?: React.FormEvent, forceMerge: boolean = false) => {
    // Check for duplicate ingredients if not forcing merge
    if (!forceMerge) {
      const distinctIds = new Set<string>();
      const duplicates = new Set<string>();
      
      for (const row of materialRows) {
        if (row.ingredientId) {
          if (distinctIds.has(row.ingredientId)) {
            duplicates.add(row.ingredientId);
          } else {
            distinctIds.add(row.ingredientId);
          }
        }
      }

      if (duplicates.size > 0) {
        const names = Array.from(duplicates).map(id => ingredients.find(i => i.id === id)?.name || 'Desconocido');
        setDuplicateNames(names);
        setShowDuplicateModal(true);
        return;
      }
    }

    setLoading(true);
    
    // Prepare rows (merge if forced/needed, though if we are here via forceMerge, we should use the merged state... 
    // actually, simpler: calculate merged rows here if forceMerge is true OR just rely on the caller to update state?
    // Let's rely on the helper to update state before calling this if needed, OR do it here.
    // Logic: If forceMerge, we merge materialRows locally for the DB insert.
    
    let currentMaterialRows = [...materialRows];
    if (forceMerge) {
      const mergedMap = new Map<string, number>();
      currentMaterialRows.forEach(row => {
        if (!row.ingredientId) return;
        const current = mergedMap.get(row.ingredientId) || 0;
        mergedMap.set(row.ingredientId, current + row.qty);
      });
      
      currentMaterialRows = Array.from(mergedMap.entries()).map(([id, qty]) => ({
        ingredientId: id,
        qty
      }));
       
       // Also update the UI state so the user sees the merge happened
       setMaterialRows(currentMaterialRows);
    }

    try {
      let currentProductId = productId;

      if (currentProductId) {
        // --- 1. UPDATE ---
        const { error: prodError } = await supabase.from('products').update({
          name, description, price: Number(salePrice), category_id: categoryId, image_url: imageUrl,
          units_per_month: Number(unitsPerMonth), days_per_month: Number(daysPerMonth)
        }).eq('id', currentProductId);
        if (prodError) throw prodError;

        // Clear relationships to re-insert (Simple "Replace All" strategy)
        await supabase.from('product_labor').delete().eq('product_id', currentProductId);
        await supabase.from('product_ingredients').delete().eq('product_id', currentProductId);
        await supabase.from('product_expenses').delete().eq('product_id', currentProductId);

      } else {
        // --- 2. CREATE ---
        const { data: prod, error } = await supabase.from('products').insert({
          name, description, price: Number(salePrice), category_id: categoryId, image_url: imageUrl,
          units_per_month: Number(unitsPerMonth), days_per_month: Number(daysPerMonth)
        }).select().single();
        if (error) throw error;
        currentProductId = prod.id;
      }

      if (!currentProductId) throw new Error("ID de producto no válido");

      // Insert fresh relationships
      if (laborRows.length > 0) {
        await supabase.from('product_labor').insert(laborRows.map(r => ({
          product_id: currentProductId, role_name: r.role, qty_staff: r.qty, base_salary: r.salary
        })));
      }
      if (currentMaterialRows.length > 0) {
        await supabase.from('product_ingredients').insert(currentMaterialRows.map(r => ({
          product_id: currentProductId, ingredient_id: r.ingredientId, quantity_needed: r.qty 
        })));
      }
      if (expenseRows.length > 0) {
        await supabase.from('product_expenses').insert(expenseRows.map(r => ({
          product_id: currentProductId, expense_type: r.type, unit: r.unit, qty_used: r.qty, unit_cost: r.cost
        })));
      }

      alert('Producto guardado correctamente');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
      setShowDuplicateModal(false);
    }
  };

  const addLabor = () => setLaborRows([...laborRows, { role: '', qty: 1, salary: Number(configs['labor.min_wage'] || 0) }]);
  const addMaterial = () => setMaterialRows([...materialRows, { ingredientId: '', qty: 0 }]);

  const addExpense = () => setExpenseRows([...expenseRows, { type: '', unit: '', qty: 0, cost: 0, sourceKey: '' }]);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} style={{ maxWidth: '95vw', width: '1000px', height: '90vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <h2 style={{ margin: 0 }}>{productId ? 'Editar Producto - Hoja de Costos' : 'Nuevo Producto - Hoja de Costos'}</h2>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              Costo Unitario: <strong>${Math.round(unitCost).toLocaleString()}</strong> | 
              Margen: <strong style={{ color: margin > 30 ? 'green' : margin > 0 ? 'orange' : 'red' }}>{margin.toFixed(1)}%</strong>
            </div>
          </div>
          <button onClick={onClose}><X size={24} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #eee', padding: '0 1rem' }}>
          {[
            { id: 'info', label: '1. Infomación Básica' },
            { id: 'labor', label: '2. Mano de Obra' },
            { id: 'materials', label: '3. Materia Prima' },
            { id: 'expenses', label: '4. Gastos Fab.' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              style={{
                padding: '1rem',
                border: 'none',
                background: 'none',
                borderBottom: activeSection === tab.id ? '2px solid var(--primary)' : 'none',
                fontWeight: activeSection === tab.id ? 'bold' : 'normal',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content - Scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', backgroundColor: '#f9f9f9' }}>
          
          {/* SECTION 1: INFO */}
          {activeSection === 'info' && (
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nombre Producto</label>
                <input className={styles.input} value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Categoría</label>
                <select className={styles.input} value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                  <option value="">Seleccione...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Precio de Venta</label>
                <input 
                  type="number" 
                  className={styles.input} 
                  value={salePrice} 
                  onChange={e => setSalePrice(e.target.value)} 
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Est. Unidades / Mes</label>
                <input 
                  type="number" 
                  className={styles.input} 
                  value={unitsPerMonth} 
                  onChange={e => setUnitsPerMonth(e.target.value)} 
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Días Laborados / Mes</label>
                <input 
                  type="number" 
                  className={styles.input} 
                  value={daysPerMonth} 
                  onChange={e => setDaysPerMonth(e.target.value)} 
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Imagen URL</label>
                <input className={styles.input} value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
              </div>
              <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                <label className={styles.label}>Descripción</label>
                <textarea className={styles.input} value={description} onChange={e => setDescription(e.target.value)} />
              </div>
            </div>
          )}

          {/* SECTION 2: LABOR */}
          {activeSection === 'labor' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h4>Mano de Obra Directa</h4>
                <button className="btn btn-outline" onClick={addLabor}><Plus size={14}/> Cargo</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                    <th style={{ padding: 8 }}>Cargo</th>
                    <th style={{ padding: 8 }}>Cant.</th>
                    <th style={{ padding: 8 }}>Salario Base</th>
                    <th style={{ padding: 8 }}>Total Mensual (con Prestaciones)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {laborRows.map((row, i) => {
                    const cost = laborCosts[i];
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                        <td>
                          <input 
                            className={styles.input} 
                            value={row.role} 
                            onChange={e => {
                              const newRows = [...laborRows];
                              newRows[i].role = e.target.value;
                              setLaborRows(newRows);
                            }}
                            placeholder="Ej. Cocinero"
                          />
                        </td>
                        <td>
                          <input type="number" className={styles.input} style={{ width: 60 }} 
                            value={row.qty} onChange={e => {
                              const newRows = [...laborRows];
                              newRows[i].qty = Number(e.target.value);
                              setLaborRows(newRows);
                            }} 
                          />
                        </td>
                        <td>
                          <input type="number" className={styles.input}
                            value={row.salary} onChange={e => {
                              const newRows = [...laborRows];
                              newRows[i].salary = Number(e.target.value);
                              setLaborRows(newRows);
                            }} 
                          />
                        </td>
                        <td style={{ fontWeight: 'bold' }}>${Math.round(cost.totalMonthly).toLocaleString()}</td>
                        <td>
                          <button onClick={() => setLaborRows(laborRows.filter((_, idx) => idx !== i))} style={{ color: 'red' }}><Trash size={14}/></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'right', padding: 10 }}><strong>Total Mensual:</strong></td>
                    <td style={{ padding: 10, fontWeight: 'bold', fontSize: '1.1rem' }}>${Math.round(totalLaborMonthly).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
              <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '1rem' }}>
                * Incluye prestaciones, seguridad social, parafiscales y dotación según configuración.
              </div>
            </div>
          )}

          {/* SECTION 3: MATERIALS */}
          {activeSection === 'materials' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h4>Materias Primas (Ingredientes)</h4>
                <button className="btn btn-outline" onClick={addMaterial}><Plus size={14}/> Ingrediente</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                      <th style={{ padding: 8 }}>Ingrediente</th>
                      <th style={{ padding: 8 }}>Unidad</th>
                      <th style={{ padding: 8 }}>Cant. por Unidad Prod</th>
                      <th style={{ padding: 8 }}>Costo Unit. Ing</th>
                      <th style={{ padding: 8 }}>Costo Mensual Total ({unitsPerMonth} Unds)</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialRows.map((row, i) => {
                      const cost = materialCosts[i];
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                          <td>
                            <select 
                              className={styles.input} 
                              value={row.ingredientId}
                              onChange={e => {
                                const newRows = [...materialRows];
                                newRows[i].ingredientId = e.target.value;
                                setMaterialRows(newRows);
                              }}
                            >
                              <option value="">Seleccionar...</option>
                              {ingredients.map(ing => (
                                <option key={ing.id} value={ing.id}>{ing.name}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: 8 }}>{cost.unitName || '-'}</td>
                          <td>
                            <input type="number" className={styles.input} style={{ width: 80 }}
                              value={row.qty} onChange={e => {
                                const newRows = [...materialRows];
                                newRows[i].qty = Number(e.target.value);
                                setMaterialRows(newRows);
                              }} 
                            />
                          </td>
                          <td style={{ padding: 8 }}>${cost.unitCost.toLocaleString()}</td>
                          <td style={{ fontWeight: 'bold' }}>${Math.round(cost.totalMonthly).toLocaleString()}</td>
                          <td>
                            <button onClick={() => setMaterialRows(materialRows.filter((_, idx) => idx !== i))} style={{ color: 'red' }}><Trash size={14}/></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'right', padding: 10 }}><strong>Total Mensual Mat. Prima:</strong></td>
                      <td style={{ padding: 10, fontWeight: 'bold', fontSize: '1.1rem' }}>${Math.round(totalMaterialsMonthly).toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 4: EXPENSES */}
          {activeSection === 'expenses' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h4>Gastos de Fabricación</h4>
                <button className="btn btn-outline" onClick={addExpense}><Plus size={14}/> Gasto</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                    <th style={{ padding: 8 }}>Concepto</th>
                    <th style={{ padding: 8 }}>Unidad</th>
                    <th style={{ padding: 8 }}>Cant. Mensual</th>
                    <th style={{ padding: 8 }}>Costo Unitario</th>
                    <th style={{ padding: 8 }}>Total Mensual</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {expenseRows.map((row, i) => {
                    const cost = expenseCosts[i];
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                        <td>
                          {row.sourceKey === 'custom' ? (
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <input className={styles.input} placeholder="Manual..."
                                value={row.type} onChange={e => {
                                  const newRows = [...expenseRows];
                                  newRows[i].type = e.target.value;
                                  setExpenseRows(newRows);
                                }}
                                autoFocus 
                              />
                              <button className="btn btn-outline" style={{ padding: '0 5px' }} title="Volver a lista"
                                onClick={() => {
                                    const newRows = [...expenseRows];
                                    newRows[i].sourceKey = ''; // reset to select
                                    newRows[i].type = '';
                                    setExpenseRows(newRows);
                                }}>
                                <ChevronDown size={14} />
                              </button>
                            </div>
                          ) : (
                            <select 
                              className={styles.input}
                              value={row.sourceKey || ''}
                              onChange={e => {
                                  const val = e.target.value;
                                  const newRows = [...expenseRows];
                                  newRows[i].sourceKey = val;
                                  
                                  if (val === 'custom') {
                                      newRows[i].type = '';
                                      newRows[i].unit = '';
                                      newRows[i].cost = 0;
                                  } else {
                                      const cfg = manufacturingOptions.find(c => c.key === val);
                                      if (cfg) {
                                          newRows[i].type = cfg.label;
                                          newRows[i].cost = Number(cfg.value || 0);
                                          newRows[i].unit = inferUnit(cfg.key);
                                      }
                                  }
                                  setExpenseRows(newRows);
                              }}
                            >
                              <option value="">Seleccione Gasto...</option>
                              {manufacturingOptions.map(opt => (
                                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                              ))}
                              <option value="custom">-- Otro Gasto (Manual) --</option>
                            </select>
                          )}
                        </td>
                        <td>
                          <input className={styles.input} placeholder="Unidad" style={{ width: 60 }}
                            value={row.unit} onChange={e => {
                              const newRows = [...expenseRows];
                              newRows[i].unit = e.target.value;
                              setExpenseRows(newRows);
                            }}
                          />
                        </td>
                        <td>
                          <input type="number" className={styles.input} placeholder="0"
                            value={row.qty} onChange={e => {
                              const newRows = [...expenseRows];
                              newRows[i].qty = Number(e.target.value);
                              setExpenseRows(newRows);
                            }}
                          />
                        </td>
                        <td>
                          {/* We could add logic to fetch from config if key matches, for now manual */}
                          <input type="number" className={styles.input} placeholder="0"
                            value={row.cost} onChange={e => {
                              const newRows = [...expenseRows];
                              newRows[i].cost = Number(e.target.value);
                              setExpenseRows(newRows);
                            }}
                          />
                        </td>
                        <td style={{ fontWeight: 'bold' }}>${Math.round(cost.totalMonthly).toLocaleString()}</td>
                        <td>
                          <button onClick={() => setExpenseRows(expenseRows.filter((_, idx) => idx !== i))} style={{ color: 'red' }}><Trash size={14}/></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'right', padding: 10 }}><strong>Total Mensual Gastos:</strong></td>
                      <td style={{ padding: 10, fontWeight: 'bold', fontSize: '1.1rem' }}>${Math.round(totalExpensesMonthly).toLocaleString()}</td>
                    </tr>
                </tfoot>
              </table>
              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#eef', borderRadius: '8px' }}>
                 <strong>Resumen de Costos:</strong>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <div>Mano de Obra: ${Math.round(totalLaborMonthly).toLocaleString()}</div>
                    <div>Materia Prima: ${Math.round(totalMaterialsMonthly).toLocaleString()}</div>
                    <div>Gastos Fabricación: ${Math.round(totalExpensesMonthly).toLocaleString()}</div>
                    <div style={{ borderTop: '1px solid #aaa', paddingTop: '0.5rem', fontWeight: 'bold' }}>
                      Costo Total Producción: ${Math.round(totalProductionCostMonthly).toLocaleString()}
                    </div>
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => handleSubmit()} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Producto y Costos'}
          </button>
        </div>

        {/* Duplicate Warning Modal */}
        {showDuplicateModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{
              backgroundColor: 'white', padding: '2rem', borderRadius: '8px',
              maxWidth: '500px', width: '90%', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', color: '#f59e0b' }}>
                <AlertTriangle size={32} />
                <h3 style={{ margin: 0, color: '#333' }}>Ingredientes Duplicados</h3>
              </div>
              <p>Se han encontrado los siguientes ingredientes repetidos:</p>
              <ul style={{ backgroundColor: '#fffbe6', padding: '1rem', borderRadius: '4px', listStylePosition: 'inside' }}>
                {duplicateNames.map((name, i) => <li key={i}>{name}</li>)}
              </ul>
              <p>¿Qué desea hacer?</p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button className="btn" onClick={() => setShowDuplicateModal(false)}>
                  Modificar
                </button>
                <button className="btn btn-primary" onClick={() => handleSubmit(undefined, true)}>
                  Continuar de todos modos
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
