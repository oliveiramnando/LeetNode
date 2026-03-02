import "./globals.css";
import Navbar from "../components/Navbar";
import { AuthProvider } from "../components/auth/AuthProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#2D2D2D] text-white antialiased">
        <AuthProvider>
          <Navbar />
          <main className="py-10">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}