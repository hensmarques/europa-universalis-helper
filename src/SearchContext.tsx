import React, { createContext, useContext, useState } from "react";

type SearchContextValue = {
    search: string;
    setSearch: (value: string) => void;
};

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

export const SearchProvider = ({ children }: { children: React.ReactNode }) => {
    const [search, setSearch] = useState<string>("");

    return (
        <SearchContext.Provider value={{ search, setSearch }}>
            {children}
        </SearchContext.Provider>
    );
};

export const useSearch = (): SearchContextValue => {
    const ctx = useContext(SearchContext);
    if (!ctx) {
        throw new Error("useSearch must be used within a SearchProvider");
    }
    return ctx;
};


