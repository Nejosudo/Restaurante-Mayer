"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import styles from './Auth.module.css';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push('/dashboard/client');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Iniciar Sesión</h1>
      
      {error && <div className={styles.error}>{error}</div>}

      <form className={styles.form} onSubmit={handleLogin}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Correo Electrónico</label>
          <input 
            type="email" 
            className={styles.input} 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Contraseña</label>
          <input 
            type="password" 
            className={styles.input} 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'Cargando...' : 'Ingresar'}
        </button>
      </form>

      <div className={styles.footer}>
        ¿No tienes cuenta? <Link href="/register" className={styles.link}>Regístrate aquí</Link>
      </div>
    </div>
  );
}
