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

export interface Configuration {
  key: string;
  value: any;
  category: 'labor' | 'manufacturing' | 'general';
  label: string;
  description?: string;
}

export interface ProductLabor {
  id: string;
  product_id: string;
  role_name: string;
  qty_staff: number;
  base_salary: number;
}

export interface ProductExpense {
  id: string;
  product_id: string;
  expense_type: string;
  unit: string;
  qty_used: number;
  unit_cost: number;
}

// Extending Product with new fields (optional for now to match partial fetches)
export interface ProductWithCost extends Product {
  units_per_month?: number;
  days_per_month?: number;
}
