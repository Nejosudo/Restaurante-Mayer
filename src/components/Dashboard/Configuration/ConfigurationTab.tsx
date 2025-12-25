"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Configuration } from '@/types';
import { Save, Settings, DollarSign, Eye } from 'lucide-react';
import styles from '../Dashboard.module.css';

export default function ConfigurationTab() {
  const [activeSubTab, setActiveSubTab] = useState<'variables' | 'general'>('variables');

  return (
    <div>
      <div className={styles.sectionTitle} style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
        <button 
          className="btn" 
          style={{ 
            backgroundColor: activeSubTab === 'variables' ? 'var(--primary)' : '#f0f0f0',
            color: activeSubTab === 'variables' ? 'white' : 'black'
          }}
          onClick={() => setActiveSubTab('variables')}
        >
          <DollarSign size={16} style={{ marginRight: 8 }} /> Variables de Costos
        </button>
        <button 
          className="btn"
          style={{ 
            backgroundColor: activeSubTab === 'general' ? 'var(--primary)' : '#f0f0f0',
            color: activeSubTab === 'general' ? 'white' : 'black'
          }}
          onClick={() => setActiveSubTab('general')}
        >
          <Eye size={16} style={{ marginRight: 8 }} /> General (Vistas)
        </button>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        {activeSubTab === 'variables' ? <VariablesTab /> : <GeneralTab />}
      </div>
    </div>
  );
}

function VariablesTab() {
  const [configs, setConfigs] = useState<Configuration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    const { data } = await supabase
      .from('configurations')
      .select('*')
      .in('category', ['labor', 'manufacturing'])
      .order('category');
    
    if (data) setConfigs(data);
    setLoading(false);
  };

  const handeUpdate = async (key: string, newValue: string) => {
    const { error } = await supabase
      .from('configurations')
      .update({ value: newValue }) // Saving as string mostly, or convert if needed
      .eq('key', key);
    
    if (!error) {
      alert('Variable actualizada correctamente');
      fetchConfigs();
    } else {
      alert('Error al actualizar');
    }
  };

  if (loading) return <div>Cargando variables...</div>;

  const laborConfigs = configs.filter(c => c.category === 'labor');
  const manufacturingConfigs = configs.filter(c => c.category === 'manufacturing');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      <div>
        <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>Mano de Obra (Labor)</h3>
        <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
          {laborConfigs.map(config => (
            <ConfigRow key={config.key} config={config} onSave={handeUpdate} />
          ))}
        </div>
      </div>

      <div>
        <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>Manufactura & Gastos</h3>
        <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
          {manufacturingConfigs.map(config => (
            <ConfigRow key={config.key} config={config} onSave={handeUpdate} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ConfigRow({ config, onSave }: { config: Configuration, onSave: (k: string, v: string) => void }) {
  const [val, setVal] = useState(config.value);
  const [hasChanges, setHasChanges] = useState(false);

  return (
    <div className={styles.orderCard} style={{ padding: '1rem' }}>
      <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{config.label}</div>
      <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>{config.description}</div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input 
          type="text" 
          value={val} 
          onChange={(e) => {
            setVal(e.target.value);
            setHasChanges(true);
          }}
          className={styles.input}
          style={{ flex: 1 }}
        />
        {hasChanges && (
          <button 
            className="btn btn-primary"
            style={{ padding: '0 10px' }}
            onClick={() => {
              onSave(config.key, val);
              setHasChanges(false);
            }}
          >
            <Save size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

function GeneralTab() {
  const [visibility, setVisibility] = useState<any>({ products: true, ingredients: true, orders: true });
  
  useEffect(() => {
    fetchVisibility();
  }, []);

  const fetchVisibility = async () => {
    const { data } = await supabase
      .from('configurations')
      .select('value')
      .eq('key', 'general.tab_visibility')
      .single();
    
    if (data?.value) {
      setVisibility(data.value);
    }
  };

  const toggleVisibility = async (tab: string) => {
    const newVisibility = { ...visibility, [tab]: !visibility[tab] };
    setVisibility(newVisibility);
    
    await supabase
      .from('configurations')
      .update({ value: newVisibility })
      .eq('key', 'general.tab_visibility');
  };

  return (
    <div>
      <h3>Visibilidad de Pestañas</h3>
      <p style={{ color: '#666', marginBottom: '1rem' }}>Selecciona qué pestañas están visibles en el panel (Configuraciones siempre es visible).</p>
      
      <div style={{ display: 'grid', gap: '1rem', maxWidth: '400px' }}>
        {['products', 'ingredients', 'orders'].map(tab => (
          <div key={tab} className={styles.orderCard} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}>
            <span style={{ textTransform: 'capitalize' }}>
              {tab === 'products' ? 'Productos' : tab === 'ingredients' ? 'Ingredientes' : 'Pedidos'}
            </span>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={visibility[tab]} 
                onChange={() => toggleVisibility(tab)}
              />
              <span className="slider round"></span>
            </label>
          </div>
        ))}
      </div>
      
      {/* Simple CCS for toggle switch if not present globallly, strictly inline for safety */}
      <style jsx>{`
        .switch {
          position: relative;
          display: inline-block;
          width: 40px;
          height: 24px;
        }
        .switch input { 
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
          border-radius: 34px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        input:checked + .slider {
          background-color: var(--primary);
        }
        input:checked + .slider:before {
          transform: translateX(16px);
        }
      `}</style>
    </div>
  );
}
