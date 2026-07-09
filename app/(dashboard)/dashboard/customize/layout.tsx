// app/(dashboard)/dashboard/customize/layout.tsx
import { ReactNode } from "react";

export default function CustomizeLayout({ children }: { children: ReactNode }) {
    return (
        <div className="fixed inset-0 z-[100] flex h-screen w-full overflow-hidden bg-slate-950 text-slate-50">
            {children}
        </div>
    );
}
