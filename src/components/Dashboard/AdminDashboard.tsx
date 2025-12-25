"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, ShoppingBag, LogOut, Settings, ChefHat } from 'lucide-react'; // Added Settings, ChefHat for Ingredients
import { supabase } from '@/lib/supabaseClient';
import styles from './Dashboard.module.css';
import InventoryTab from './Inventory/InventoryTab';
import ConfigurationTab from './Configuration/ConfigurationTab';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('products');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tabVisibility, setTabVisibility] = useState<any>({ products: true, ingredients: true, orders: true });
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        alert('Acceso denegado. Se requiere rol de administrador.');
        router.push('/');
        return;
      }

      // Fetch tab settings
      const { data: config } = await supabase
        .from('configurations')
        .select('value')
        .eq('key', 'general.tab_visibility')
        .single();
      
      if (config?.value) {
        setTabVisibility(config.value);
      }

      setIsAdmin(true);
      setLoading(false);
    };

    checkAdmin();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) return <div className="container">Verificando permisos...</div>;
  if (!isAdmin) return null;

  return (
    <div className={`container ${styles.container}`}>
      <aside className={styles.sidebar}>
        <div className={styles.sectionTitle} style={{ fontSize: '1.2rem', border: 'none' }}>
          Panel Admin
        </div>
        <ul className={styles.menu}>
          {tabVisibility.products && (
            <li 
              className={`${styles.menuItem} ${activeTab === 'products' ? styles.active : ''}`}
              onClick={() => setActiveTab('products')}
            >
              <Package size={20} /> Productos
            </li>
          )}
          
          {tabVisibility.ingredients && (
            <li 
              className={`${styles.menuItem} ${activeTab === 'ingredients' ? styles.active : ''}`}
              onClick={() => setActiveTab('ingredients')}
            >
              <ChefHat size={20} /> Ingredientes
            </li>
          )}

          {tabVisibility.orders && (
            <li 
              className={`${styles.menuItem} ${activeTab === 'orders' ? styles.active : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <ShoppingBag size={20} /> Pedidos
            </li>
          )}

          <li 
            className={`${styles.menuItem} ${activeTab === 'configuration' ? styles.active : ''}`}
            onClick={() => setActiveTab('configuration')}
          >
            <Settings size={20} /> Configuraciones
          </li>

          <li className={styles.menuItem} onClick={handleLogout} style={{ marginTop: 'auto', color: 'var(--error)' }}>
            <LogOut size={20} /> Cerrar Sesión
          </li>
        </ul>
      </aside>

      <main className={styles.content}>
        {activeTab === 'products' && <InventoryTab mode="products" />}
        {activeTab === 'ingredients' && <InventoryTab mode="ingredients" />}
        {activeTab === 'orders' && <OrdersTab />}
        {activeTab === 'configuration' && <ConfigurationTab />}
      </main>
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, profiles(first_name, last_name, email)')
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);
    
    if (error) alert('Error al actualizar estado');
    else fetchOrders();
  };

  return (
    <div>
      <h2 className={styles.sectionTitle}>Gestión de Pedidos</h2>
      {orders.length === 0 ? (
        <p>No hay pedidos registrados.</p>
      ) : (
        orders.map(order => (
          <div key={order.id} className={styles.orderCard}>
            <div className={styles.orderHeader}>
              <div>
                <strong>Pedido #{order.id.slice(0, 8)}</strong>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  Cliente: {order.profiles?.first_name} {order.profiles?.last_name} ({order.profiles?.email})
                </div>
              </div>
              <select 
                value={order.status}
                onChange={(e) => updateStatus(order.id, e.target.value)}
                className={styles.input}
                style={{ width: 'auto', padding: '4px 8px' }}
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_proceso">En Proceso</option>
                <option value="completado">Completado</option>
                <option value="entregado">Entregado</option>
              </select>
            </div>
            <p>Total: <strong>${order.total_amount.toLocaleString()}</strong></p>
            <p style={{ fontSize: '0.85rem', color: '#888' }}>
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

