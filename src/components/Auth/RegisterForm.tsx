"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import styles from './Auth.module.css';

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    cedula: '',
    birthDate: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            cedula: formData.cedula,
            birth_date: formData.birthDate,
            address: formData.address
          }
        }
      });

      if (error) throw error;

      alert('Registro exitoso! Por favor verifica tu correo (si está habilitado) o inicia sesión.');
      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container} style={{ maxWidth: '600px' }}>
      <h1 className={styles.title}>Registro de Cliente</h1>
      
      {error && <div className={styles.error}>{error}</div>}

      <form className={styles.form} onSubmit={handleRegister}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Nombre</label>
            <input name="firstName" className={styles.input} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Apellido</label>
            <input name="lastName" className={styles.input} onChange={handleChange} required />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Cédula</label>
          <input name="cedula" className={styles.input} onChange={handleChange} required />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Fecha de Nacimiento</label>
          <input type="date" name="birthDate" className={styles.input} onChange={handleChange} required />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Dirección</label>
          <input name="address" className={styles.input} onChange={handleChange} required />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Correo Electrónico</label>
          <input type="email" name="email" className={styles.input} onChange={handleChange} required />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Contraseña</label>
          <input type="password" name="password" className={styles.input} onChange={handleChange} required />
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'Cargando...' : 'Registrarse'}
        </button>
      </form>

      <div className={styles.footer}>
        ¿Ya tienes cuenta? <Link href="/login" className={styles.link}>Inicia sesión aquí</Link>
      </div>
    </div>
  );
}
