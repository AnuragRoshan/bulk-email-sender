import "./globals.css";

export const metadata = {
  title: "Bulk Email Sender",
  description: "Send personalized emails to recruiters",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
