import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import CartDrawer from "@/components/Cart/CartDrawer";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Restaurante Mayer",
  description: "Restaurante Virtual Mayer - Calidad y Elegancia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={outfit.className}>
        <AuthProvider>
          <CartProvider>
            {children}
            <CartDrawer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
