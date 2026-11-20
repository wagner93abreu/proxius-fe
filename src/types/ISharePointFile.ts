export interface ISharePointFile {
    id: string;
    name: string;
    size: number | null;
    webUrl: string | null;
    contentType: string | null;
    lastModifiedDateTime: string | null;
    folder?: { childCount?: number } | null;
}

export type SharePointLinkType = "view" | "edit";

export interface IShareLink {
    webUrl: string;
    type: SharePointLinkType;
    scope: string;
    expirationDateTime: string | null;
}

export interface ISharePointPreview {
    url: string;
}

export interface ISharePointCapabilities {
    linksEnabled: boolean;
    canDelete: boolean;
    canUpload: boolean;
    canCreateFolder?: boolean;
    /** Rename/recursive delete of folders: staff or the owning enabled client. Distinct from canDelete (staff file deletion). */
    canManageFolders?: boolean;
    maxFileSizeBytes: number;
}
