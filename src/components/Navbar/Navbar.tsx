"use client";

import Link from 'next/link';
import { ShoppingCart, User, LayoutDashboard } from 'lucide-react';
import styles from './Navbar.module.css';
import { useCart } from '@/context/CartContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User as SupabaseUser } from '@supabase/supabase-js';

const CATEGORIES = [
  { name: 'Todos', href: '/' },
  { name: 'Desayunos', href: '/?category=desayunos' },
  { name: 'Almuerzos', href: '/?category=almuerzos' },
  { name: 'Comidas', href: '/?category=comidas' },
  { name: 'Especiales', href: '/?category=especiales' },
  { name: 'Bebidas', href: '/?category=bebidas' },
  { name: 'Infantil', href: '/?category=infantil' },
];

export default function Navbar() {
  const { count, toggleCart } = useCart();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async (userId: string) => {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      setRole(data?.role || 'client');
    };

    // Check active session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchRole(user.id);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
      } else {
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.nav}`}>
        <Link href="/" className={styles.logo}>
          Mayer
        </Link>

        <ul className={styles.links}>
          {CATEGORIES.map((cat) => (
            <li key={cat.name}>
              <Link href={cat.href} className={styles.link}>
                {cat.name}
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          {user ? (
            <Link 
              href={role === 'admin' ? '/dashboard/admin' : '/dashboard/client'} 
              className="btn btn-primary"
            >
              <LayoutDashboard size={18} style={{ marginRight: '8px' }} />
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="btn btn-outline">
              <User size={18} style={{ marginRight: '8px' }} />
              Ingresar
            </Link>
          )}
          
          <button className={styles.cartBtn} onClick={toggleCart}>
            <ShoppingCart size={24} />
            {count > 0 && <span className={styles.badge}>{count}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}
