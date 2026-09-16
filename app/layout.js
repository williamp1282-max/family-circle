import "./globals.css";

export const metadata = {
  title: "Family Circle",
  description: "A private space for your family to share photos and updates.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
