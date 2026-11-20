export default interface IContractTemplateVersion {
    id: string | number | null;
    templateId: string | number;
    version: string;
    active: boolean;
    htmlTemplate: string;
    description: string;
    createdAt: string | null;
    updatedAt: string | null;
    createdBy: string | number | null;
}
