import { useState } from 'react';
import { X, Minus, Plus, ShoppingCart } from 'lucide-react';
import styles from './ProductModal.module.css';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const { addToCart } = useCart();

  if (!isOpen) return null;

  const handleIncrement = () => setQuantity(q => q + 1);
  const handleDecrement = () => setQuantity(q => Math.max(1, q - 1));

  const handleAddToCart = () => {
    addToCart(product, quantity, note);
    onClose();
    setQuantity(1);
    setNote('');
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>

        <div className={styles.imageContainer}>
          <img 
            src={product.image_url || product.imageUrl || "https://via.placeholder.com/600"} 
            alt={product.name} 
            className={styles.image} 
          />
        </div>

        <div className={styles.content}>
          <div className={styles.header}>
            <h2 className={styles.title}>{product.name}</h2>
            <p className={styles.price}>${product.price.toLocaleString()}</p>
          </div>

          <p className={styles.description}>
            {product.description || "Delicioso plato preparado con los mejores ingredientes."}
          </p>

          <div className={styles.formGroup}>
            <label className={styles.label}>Nota para el chef (Opcional)</label>
            <textarea 
              className={styles.textarea}
              placeholder="Ej: Sin cebolla, salsa aparte..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Cantidad</label>
            <div className={styles.quantityControl}>
              <button className={styles.qtyBtn} onClick={handleDecrement}>
                <Minus size={18} />
              </button>
              <span className={styles.qtyValue}>{quantity}</span>
              <button className={styles.qtyBtn} onClick={handleIncrement}>
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div className={styles.footer}>
            <button className={styles.addToCartBtn} onClick={handleAddToCart}>
              <ShoppingCart size={20} />
              Agregar al Carrito - ${(product.price * quantity).toLocaleString()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
