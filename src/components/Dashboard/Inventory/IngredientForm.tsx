"use client";

import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import styles from '../Dashboard.module.css';

interface IngredientFormProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function IngredientForm({ onClose, onSuccess }: IngredientFormProps) {
    const [loading, setLoading] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [unit, setUnit] = useState('');
    const [costPerUnit, setCostPerUnit] = useState('');
    const [stock, setStock] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('ingredients')
                .insert({
                    name,
                    unit,
                    cost_per_unit: parseFloat(costPerUnit),
                    stock: parseFloat(stock)
                });

            if (error) throw error;

            alert('Ingrediente creado exitosamente');
            onSuccess();
            onClose();
        } catch (error: any) {
            alert('Error al crear ingrediente: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal} style={{ maxWidth: '500px' }}>
                <div className={styles.modalHeader}>
                    <h2>Nuevo Ingrediente</h2>
                    <button onClick={onClose}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Nombre</label>
                        <input
                            className={styles.input}
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            placeholder="Ej: Harina, Tomate, Queso"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Unidad de Medida</label>
                        <select
                            className={styles.input}
                            value={unit}
                            onChange={e => setUnit(e.target.value)}
                            required
                        >
                            <option value="">Seleccionar...</option>
                            <option value="gramo">gramo</option>
                            <option value="mililitro">mililitro</option>
                            <option value="unidad">unidad</option>
                            {/* <option value="kilo">kilogramo</option> */}
                            {/* <option value="litro">litro</option> */}
                        </select>
                    </div>

                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Costo por Unidad ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                className={styles.input}
                                value={costPerUnit}
                                onChange={e => setCostPerUnit(e.target.value)}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Stock Inicial</label>
                            <input
                                type="number"
                                step="0.01"
                                className={styles.input}
                                value={stock}
                                onChange={e => setStock(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className={styles.saveBtn} disabled={loading} style={{ width: '100%', marginTop: '2rem' }}>
                        {loading ? 'Guardando...' : 'Crear Ingrediente'}
                    </button>
                </form>
            </div>
        </div>
    );
}
