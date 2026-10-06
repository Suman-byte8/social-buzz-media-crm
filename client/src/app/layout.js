import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";
import ReduxProvider from "@/redux/ReduxProvider";
import { AuthProvider } from "@/app/login/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Agency OS | Social Buzz Media CRM",
  description: "Social Buzz Media CRM & Agency OS",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script> */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Curated set for the Report Builder's typography controls (see
            PropertiesPanel.js's font-family select / pairing presets) —
            loaded globally here, same as Inter above, so they're ready
            before any report page tries to render with them. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Lora:wght@400;500;600&family=Poppins:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&family=DM+Serif+Display&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-full flex flex-col bg-background text-on-background font-sans"
        suppressHydrationWarning
      >
<ReduxProvider>
           <AuthProvider>
             <AppLayout>{children}</AppLayout>
           </AuthProvider>
         </ReduxProvider>
      </body>
    </html>
  );
}
