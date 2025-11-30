export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  imageUrl?: string; // Fallback for legacy
  is_available: boolean;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  stock: number;
}

export interface ProductIngredient {
  product_id: string;
  ingredient_id: string;
  quantity_needed: number;
}
