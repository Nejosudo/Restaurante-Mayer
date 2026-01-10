"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Configuration } from '@/types';
import { Save, Settings, DollarSign, CreditCard } from 'lucide-react';
import styles from '../Dashboard.module.css';

export default function ConfigurationTab() {
  const [activeSubTab, setActiveSubTab] = useState<'variables' | 'payment'>('variables');

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
            backgroundColor: activeSubTab === 'payment' ? 'var(--primary)' : '#f0f0f0',
            color: activeSubTab === 'payment' ? 'white' : 'black'
          }}
          onClick={() => setActiveSubTab('payment')}
        >
          <CreditCard size={16} style={{ marginRight: 8 }} /> Información de Pago
        </button>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        {activeSubTab === 'variables' ? <VariablesTab /> : <PaymentTab />}
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

function PaymentTab() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentInfo();
  }, []);

  const fetchPaymentInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('configurations')
        .select('*')
        .eq('key', 'payment.contact_number')
        .single();
      
      if (data) {
        setPhoneNumber(data.value);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Check if configuration exists
    const { data: existing } = await supabase.from('configurations').select('*').eq('key', 'payment.contact_number').single();

    let error;
    if (existing) {
      const { error: err } = await supabase
        .from('configurations')
        .update({ value: phoneNumber })
        .eq('key', 'payment.contact_number');
      error = err;
    } else {
      const { error: err } = await supabase
        .from('configurations')
        .insert({
          key: 'payment.contact_number',
          value: phoneNumber,
          label: 'Número de Contacto / Nequi / Daviplata',
          category: 'general',
          description: 'Número que aparecerá a los clientes para realizar el pago.'
        });
      error = err;
    }

    if (error) {
      alert('Error al guardar: ' + error.message);
    } else {
      alert('Información de pago actualizada correctamente');
    }
  };

  if (loading) return <div>Cargando información...</div>;

  return (
    <div>
      <h3>Configuración de Pagos</h3>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        Configure la información que verán los clientes al momento de realizar el pago de sus pedidos.
      </p>
      
      <div className={styles.orderCard} style={{ maxWidth: '500px', padding: '1.5rem' }}>
        <div className={styles.formGroup}>
          <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={18} /> Número de Celular (Nequi / Daviplata)
          </label>
          <input 
            type="text" 
            className={styles.input}
            placeholder="Ej: 300 123 4567"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <small style={{ display: 'block', marginTop: '0.5rem', color: '#888' }}>
            Este número se mostrará en las instrucciones de pago para los clientes.
          </small>
        </div>
        
        <button 
          className="btn btn-primary" 
          style={{ marginTop: '1.5rem', width: '100%' }}
          onClick={handleSave}
        >
          Guardar Información
        </button>
      </div>
    </div>
  );
}
