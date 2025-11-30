import { ShoppingCart } from 'lucide-react';
import styles from './ProductCard.module.css';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  product: Product;
  onOpenModal: (product: Product) => void;
}

export default function ProductCard({ product, onOpenModal }: ProductCardProps) {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1, '');
  };

  return (
    <article className={styles.card}>
      <div className={styles.imageContainer}>
        {/* Replace with Next/Image later */}
        <img 
          src={product.image_url || product.imageUrl || "https://via.placeholder.com/300"} 
          alt={product.name} 
          className={styles.image} 
        />
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{product.name}</h3>
        <p className={styles.price}>${product.price.toLocaleString()}</p>
        
        <div className={styles.actions}>
          <button 
            className={styles.detailsBtn}
            onClick={() => onOpenModal(product)}
          >
            Ver detalles
          </button>
          <button className={styles.addBtn} onClick={handleAddToCart}>
            <ShoppingCart size={20} />
          </button>
        </div>
      </div>
    </article>
  );
}
