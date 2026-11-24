import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = { title: "Admin Panel", description: "Manage users and items" };
export const viewport = { width: "device-width", initialScale: 1, themeColor: "#5d1bb8" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
