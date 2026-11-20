export function folderDisplayName(name: string): string {
    return name.replace(/ - (?:[0-9a-f]{8}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i, "");
}
