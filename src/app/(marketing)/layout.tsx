import Footer from "@/components/Footer";
import MarketingHeader from "@/components/MarketingHeader";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingHeader />
      {children}
      <Footer />
    </>
  );
}
