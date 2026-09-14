import AppNavbar from "@/components/AppNavbar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNavbar />
      {children}
    </>
  );
}
