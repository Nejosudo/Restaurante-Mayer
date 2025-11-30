"use client";

import { X, Minus, Plus, Trash2 } from 'lucide-react';
import styles from './CartDrawer.module.css';
import { useCart } from '@/context/CartContext';

export default function CartDrawer() {
  const { isCartOpen, toggleCart, items, updateQuantity, removeFromCart, total } = useCart();

  return (
    <>
      <div 
        className={`${styles.overlay} ${isCartOpen ? styles.open : ''}`} 
        onClick={toggleCart}
      />
      
      <aside className={`${styles.drawer} ${isCartOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>Tu Pedido</h2>
          <button className={styles.closeBtn} onClick={toggleCart}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.items}>
          {items.length === 0 ? (
            <div className={styles.emptyCart}>
              <p>Tu carrito está vacío.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.cartItemId} className={styles.item}>
                <img 
                  src={item.product.image_url || item.product.imageUrl || "https://via.placeholder.com/100"} 
                  alt={item.product.name} 
                  className={styles.itemImage}
                />
                <div className={styles.itemDetails}>
                  <h3 className={styles.itemName}>{item.product.name}</h3>
                  <p className={styles.itemPrice}>${(item.product.price * item.quantity).toLocaleString()}</p>
                  
                  {item.note && <p className={styles.itemNote}>Nota: {item.note}</p>}

                  <div className={styles.itemControls}>
                    <button 
                      className={styles.qtyBtn}
                      onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                    >
                      <Minus size={14} />
                    </button>
                    <span>{item.quantity}</span>
                    <button 
                      className={styles.qtyBtn}
                      onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                    >
                      <Plus size={14} />
                    </button>

                    <button 
                      className={styles.removeBtn}
                      onClick={() => removeFromCart(item.cartItemId)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.totalRow}>
              <span>Total:</span>
              <span>${total.toLocaleString()}</span>
            </div>
            <button className={styles.checkoutBtn}>
              Pagar
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
