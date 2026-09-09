import type { Metadata } from "next";
import "./globals.css";
import GlobalLoadingOverlay from "@/components/GlobalLoadingOverlay";
import { NavigationLoadingProvider } from "@/components/NavigationLoadingContext";
import PageTransition from "@/components/PageTransition";
import { ModalProvider } from "@/components/CustomModal";
import { AUTHOR, AUTHOR_ORG, COPYRIGHT, WARNING } from "@/lib/credit";

export const metadata: Metadata = {
  title: "EduTrain 관리 시스템",
  description: "교사 연수 관리 시스템",
  // 제작자 표시 — 브라우저가 저장하는 문서 정보와 소스 보기에 남는다.
  // 화면에 뜨는 표시(app/components/Credit.tsx)를 지우고 배포하더라도
  // 여기까지 지우려면 코드를 손대야 한다.
  authors: [{ name: `${AUTHOR} (${AUTHOR_ORG})` }],
  creator: AUTHOR,
  publisher: AUTHOR,
  other: { copyright: COPYRIGHT, license: WARNING },
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
