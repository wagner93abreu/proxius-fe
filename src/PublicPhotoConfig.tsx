import React, { createContext, useContext, useEffect, useState } from "react";
import http from "./http";

const PhotoBaseContext = createContext<string | null>(null);

export function PublicPhotoConfigProvider({ children }: { children: React.ReactNode }) {
    const [baseUrl, setBaseUrl] = useState<string | null>(null);
    const [error, setError] = useState(false);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (window.location.hostname === "localhost") return;
        let active = true;
        setError(false);
        http.get<{ publicPhotoBaseUrl: string }>("public-config").then(({ data }) => {
            const url = new URL(data.publicPhotoBaseUrl);
            if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
                throw new Error("URL pública de fotos inválida");
            }
            if (active) setBaseUrl(url.href.endsWith("/") ? url.href : url.href + "/");
        }).catch((failure) => {
            console.error("Não foi possível carregar a configuração pública das fotos.", failure);
            if (active) setError(true);
        });
        return () => { active = false; };
    }, [attempt]);

    return (
        <PhotoBaseContext.Provider value={baseUrl}>
            {error && <div role="alert">Não foi possível carregar a configuração das fotos.{" "}
                <button onClick={() => setAttempt((value) => value + 1)}>Tentar novamente</button>
            </div>}
            {children}
        </PhotoBaseContext.Provider>
    );
}

export function usePublicPhotoBaseUrl() {
    return useContext(PhotoBaseContext);
}
