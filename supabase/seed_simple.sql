-- Script Simplificado para Insertar Datos (Ejecutar en SQL Editor de Supabase)

-- 1. Insertar Ingredientes de ejemplo
INSERT INTO public.ingredients (name, unit, cost_per_unit, stock)
VALUES 
  ('Arroz Premium', 'kilo', 4500, 50),
  ('Pechuga de Pollo', 'kilo', 18000, 30),
  ('Lomo de Res', 'kilo', 35000, 20),
  ('Papa Sabanera', 'kilo', 3000, 100);

-- 2. Insertar Productos (Usando subconsultas para obtener el ID de la categoría automáticamente)

-- DESAYUNOS
INSERT INTO public.products (category_id, name, description, price, image_url, is_available)
SELECT id, 'Calentado Paisa', 'Delicioso calentado con frijoles, arroz, huevo frito y arepa.', 18000, 'https://images.unsplash.com/photo-1593504049359-74330189a345?auto=format&fit=crop&w=800&q=80', true
FROM public.categories WHERE slug = 'desayunos' LIMIT 1;

INSERT INTO public.products (category_id, name, description, price, image_url, is_available)
SELECT id, 'Huevos Benedictinos', 'Huevos pochados sobre pan tostado con salsa holandesa y tocineta.', 22000, 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=800&q=80', true
FROM public.categories WHERE slug = 'desayunos' LIMIT 1;

INSERT INTO public.products (category_id, name, description, price, image_url, is_available)
SELECT id, 'Waffles con Frutas', 'Waffles crujientes acompañados de fresas, banano y miel de maple.', 16000, 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=800&q=80', true
FROM public.categories WHERE slug = 'desayunos' LIMIT 1;

-- ALMUERZOS
INSERT INTO public.products (category_id, name, description, price, image_url, is_available)
SELECT id, 'Bandeja Paisa', 'Plato tradicional con frijoles, arroz, carne molida, chicharrón, huevo, chorizo y arepa.', 32000, 'https://images.unsplash.com/photo-1625937751876-4515cd8e7752?auto=format&fit=crop&w=800&q=80', true
FROM public.categories WHERE slug = 'almuerzos' LIMIT 1;

INSERT INTO public.products (category_id, name, description, price, image_url, is_available)
SELECT id, 'Ajiaco Santafereño', 'Sopa tradicional de pollo y papas, servida con arroz, aguacate y alcaparras.', 28000, 'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=800&q=80', true
FROM public.categories WHERE slug = 'almuerzos' LIMIT 1;

INSERT INTO public.products (category_id, name, description, price, image_url, is_available)
SELECT id, 'Churrasco', 'Corte de carne a la parrilla (300g) acompañado de papas a la francesa y ensalada.', 45000, 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80', true
FROM public.categories WHERE slug = 'almuerzos' LIMIT 1;

-- BEBIDAS
INSERT INTO public.products (category_id, name, description, price, image_url, is_available)
SELECT id, 'Jugo Natural de Mango', 'Jugo fresco preparado en agua o leche.', 8000, 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=800&q=80', true
FROM public.categories WHERE slug = 'bebidas' LIMIT 1;

INSERT INTO public.products (category_id, name, description, price, image_url, is_available)
SELECT id, 'Limonada de Coco', 'Refrescante limonada con leche de coco.', 12000, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80', true
FROM public.categories WHERE slug = 'bebidas' LIMIT 1;
