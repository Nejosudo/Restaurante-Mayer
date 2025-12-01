import Navbar from "@/components/Navbar/Navbar";
import MenuGrid from "@/components/MenuGrid/MenuGrid";
import { supabase } from "@/lib/supabaseClient";

// Force dynamic rendering to ensure we get the latest data
export const dynamic = 'force-dynamic';

async function getMenuData() {
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_available', true);

  return { categories, products };
}

export default async function Home() {
  const { categories, products } = await getMenuData();

  return (
    <main>
      <Navbar />
      <section className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '1rem' }}>
          Restaurante May
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-light)' }}>
          Experiencia gastronómica de elegancia y sabor.
        </p>
      </section>
      
      <MenuGrid categories={categories || []} products={products || []} />
    </main>
  );
}
