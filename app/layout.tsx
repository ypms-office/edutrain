import type { Metadata } from "next";
import "./globals.css";
import GlobalLoadingOverlay from "@/components/GlobalLoadingOverlay";
import { NavigationLoadingProvider } from "@/components/NavigationLoadingContext";
import PageTransition from "@/components/PageTransition";
import { ModalProvider } from "@/components/CustomModal";

export const metadata: Metadata = {
  title: "EduTrain 관리 시스템",
  description: "교사 연수 관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <NavigationLoadingProvider>
          <ModalProvider>
            <GlobalLoadingOverlay />
            <PageTransition>
              {children}
            </PageTransition>
          </ModalProvider>
        </NavigationLoadingProvider>
      </body>
    </html>
  );
}
