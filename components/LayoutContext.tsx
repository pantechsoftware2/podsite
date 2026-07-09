'use client';

import React, { createContext, useContext } from 'react';

type LayoutType = 'netflix' | 'substack' | 'genz';

const LayoutContext = createContext<LayoutType>('netflix');

export function LayoutProvider({ value, children }: { value: LayoutType, children: React.ReactNode }) {
    return (
        <LayoutContext.Provider value={value}>
            {children}
        </LayoutContext.Provider>
    );
}

export function useLayout() {
    return useContext(LayoutContext);
}
