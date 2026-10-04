import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-slate-50 text-slate-800 antialiased">
    <Sidebar />
    <Topbar />
    <main className="min-w-0 pt-16 lg:pl-[72px]">
      <div className="mx-auto min-w-0 w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8 lg:py-6">{children}</div>
    </main>
  </div>;
}
