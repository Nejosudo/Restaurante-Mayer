"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, FileText, ShoppingBag, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import styles from './Dashboard.module.css';

export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      
      // Fetch profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      setUser(profile);
      setLoading(false);
    };

    getUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) return <div className="container">Cargando...</div>;

  return (
    <div className={`container ${styles.container}`}>
      <aside className={styles.sidebar}>
        <ul className={styles.menu}>
          <li 
            className={`${styles.menuItem} ${activeTab === 'profile' ? styles.active : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={20} /> Perfil
          </li>
          <li 
            className={`${styles.menuItem} ${activeTab === 'orders' ? styles.active : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingBag size={20} /> Pedidos
          </li>
          <li 
            className={`${styles.menuItem} ${activeTab === 'invoices' ? styles.active : ''}`}
            onClick={() => setActiveTab('invoices')}
          >
            <FileText size={20} /> Facturas
          </li>
          <li className={styles.menuItem} onClick={handleLogout} style={{ marginTop: 'auto', color: 'var(--error)' }}>
            <LogOut size={20} /> Cerrar Sesión
          </li>
        </ul>
      </aside>

      <main className={styles.content}>
        {activeTab === 'profile' && <ProfileTab user={user} />}
        {activeTab === 'orders' && <OrdersTab userId={user.id} />}
        {activeTab === 'invoices' && <InvoicesTab userId={user.id} />}
      </main>
    </div>
  );
}

function ProfileTab({ user }: { user: any }) {
  const [formData, setFormData] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    address: user.address || '',
    cedula: user.cedula || '',
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from('profiles')
      .update(formData)
      .eq('id', user.id);

    if (error) alert('Error al actualizar');
    else alert('Perfil actualizado correctamente');
  };

  return (
    <div>
      <h2 className={styles.sectionTitle}>Mi Perfil</h2>
      <form onSubmit={handleUpdate}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Nombre</label>
            <input 
              className={styles.input} 
              value={formData.first_name}
              onChange={e => setFormData({...formData, first_name: e.target.value})}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Apellido</label>
            <input 
              className={styles.input} 
              value={formData.last_name}
              onChange={e => setFormData({...formData, last_name: e.target.value})}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Dirección</label>
            <input 
              className={styles.input} 
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Cédula</label>
            <input 
              className={styles.input} 
              value={formData.cedula}
              readOnly
              style={{ background: '#f5f5f5' }}
            />
          </div>
        </div>
        <button type="submit" className={styles.saveBtn}>Guardar Cambios</button>
      </form>
    </div>
  );
}

function OrdersTab({ userId }: { userId: string }) {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (data) setOrders(data);
    };
    fetchOrders();
  }, [userId]);

  return (
    <div>
      <h2 className={styles.sectionTitle}>Mis Pedidos</h2>
      {orders.length === 0 ? (
        <p>No tienes pedidos recientes.</p>
      ) : (
        orders.map(order => (
          <div key={order.id} className={styles.orderCard}>
            <div className={styles.orderHeader}>
              <span>Pedido #{order.id.slice(0, 8)}</span>
              <span className={`${styles.orderStatus} ${styles[`status-${order.status}`]}`}>
                {order.status}
              </span>
            </div>
            <p>Fecha: {new Date(order.created_at).toLocaleDateString()}</p>
            <p>Total: <strong>${order.total_amount.toLocaleString()}</strong></p>
          </div>
        ))
      )}
    </div>
  );
}

function InvoicesTab({ userId }: { userId: string }) {
  return (
    <div>
      <h2 className={styles.sectionTitle}>Mis Facturas</h2>
      <p>Aquí aparecerán tus facturas generadas.</p>
    </div>
  );
}
