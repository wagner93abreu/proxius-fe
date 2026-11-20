import { useCallback, useEffect, useRef, useState } from "react";
import * as sharepoint from "../http/sharepoint";
import { ISharePointCapabilities, ISharePointFile } from "../types/ISharePointFile";

export function useSharePointFiles(cliforId?: string | number | null, parentId?: string | null) {
    const [files, setFiles] = useState<ISharePointFile[]>([]);
    const [capabilities, setCapabilities] = useState<ISharePointCapabilities | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const requestId = useRef(0);
    const context = useRef({ cliforId, parentId });
    context.current = { cliforId, parentId };

    const refresh = useCallback(async () => {
        if (!cliforId) return;
        const current = ++requestId.current;
        setLoading(true);
        setError(null);
        try {
            const [list, caps] = await Promise.all([
                sharepoint.listFiles(cliforId, parentId),
                sharepoint.getCapabilities(cliforId),
            ]);
            if (current !== requestId.current) return;
            setFiles(list);
            setCapabilities(caps);
        } catch (err) {
            if (current === requestId.current) setError(sharepoint.sharePointErrorMessage(err));
        } finally {
            if (current === requestId.current) setLoading(false);
        }
    }, [cliforId, parentId]);

    useEffect(() => {
        const requests = requestId;
        setFiles([]);
        setCapabilities(null);
        refresh();
        return () => { ++requests.current; };
    }, [refresh]);

    const upload = useCallback(
        async (file: File) => {
            if (!cliforId) return;
            setError(null);
            setUploadProgress(0);
            try {
                await sharepoint.uploadFile(cliforId, file, setUploadProgress, parentId);
                if (context.current.cliforId === cliforId && context.current.parentId === parentId) {
                    await refresh();
                }
            } catch (err) {
                setError(sharepoint.sharePointErrorMessage(err));
            } finally {
                setUploadProgress(null);
            }
        },
        [cliforId, parentId, refresh]
    );

    const remove = useCallback(
        async (itemId: string) => {
            if (!cliforId) return;
            setError(null);
            try {
                await sharepoint.deleteFile(cliforId, itemId);
                if (context.current.cliforId === cliforId && context.current.parentId === parentId) {
                    setFiles((prev) => prev.filter((f) => f.id !== itemId));
                }
            } catch (err) {
                setError(sharepoint.sharePointErrorMessage(err));
            }
        },
        [cliforId, parentId]
    );

    return { files, capabilities, loading, error, setError, uploadProgress, refresh, upload, remove };
}
