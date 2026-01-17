import "./globals.css";
import { Orbitron, Space_Grotesk } from "next/font/google";

const heading = Orbitron({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-heading",
});

const body = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata = {
  title: "Solana Rock Paper Scissors League",
  description: "A competitive on-chain Rock Paper Scissors league powered by Solana.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <body className="bg-black text-white font-[var(--font-body)]">
        {children}
      </body>
    </html>
  );
}