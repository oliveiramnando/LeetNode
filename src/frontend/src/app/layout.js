import "./globals.css";
import Navbar from "../components/Navbar";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#2D2D2D] text-white antialiased">
        <Navbar />
        <main className="py-10">{children}</main>
      </body>
    </html>
  );
}