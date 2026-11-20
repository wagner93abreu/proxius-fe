export default interface IItem {
    id?: number | null;
    idproduct: string | number | null;
    product: string;
    pricing: number;
    quantity: number;
    itemOrder: number;
    unitPrice: number;
    discountType: string;
    discountValue: number;
    finalPrice: number;
}
