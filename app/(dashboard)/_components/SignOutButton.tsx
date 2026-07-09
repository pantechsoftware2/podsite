'use client';

import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import { useRouter } from 'next/navigation';

export function SignOutButton() {
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.refresh();
        router.push('/login');
    };

    return (
        <button
            onClick={handleSignOut}
            className="hover:text-red-500 hover:scale-105 transition-all duration-300 font-[family-name:var(--font-heading)]"
        >
            Sign Out
        </button>
    );
}
