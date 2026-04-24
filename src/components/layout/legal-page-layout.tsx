import type { ReactNode } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft } from "lucide-react";

interface LegalPageLayoutProps {
  title: string;
  lastUpdated?: string;
  children: ReactNode;
}

export function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = `${title} · Gather`;
    document.documentElement.lang = "en";
  }, [title]);

  return (
    <div className="w-full mx-auto min-h-screen bg-[#F2F2EF] pb-[100px] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between h-[56px] px-2 bg-white border-b border-[#E5E5E0]">
        <button 
          onClick={() => navigate('/settings')}
          className="w-[44px] h-[44px] ml-[6px] bg-transparent text-neutral-900 active:bg-[#F0F0EC] hover:bg-[#F0F0EC] transition-colors flex items-center justify-center cursor-pointer rounded-lg relative"
          aria-label="Go back to Settings"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2} />
        </button>
        <h1 className="text-[17px] font-semibold text-[#1A1A1A] absolute left-1/2 -translate-x-1/2">
          {title}
        </h1>
        <div className="w-[50px]"></div> {/* Spacer to balance the 44px + 6px button area */}
      </header>

      {/* Content Area */}
      <main className="w-full max-w-[680px] mx-auto px-8 pt-8 pb-10 bg-white rounded-xl mt-6 mb-[100px]">
        {lastUpdated && (
          <p role="doc-subtitle" className="text-[11px] font-normal tracking-wide text-neutral-400 uppercase mb-6">
            {lastUpdated}
          </p>
        )}
        <div className="legal-content">
          {children}
        </div>
      </main>
    </div>
  );
}
