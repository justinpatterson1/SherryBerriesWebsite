// Client-safe option lists + the product-form payload shape, shared by the
// add/edit modal and the create/update API routes (no server-only deps).

export const JEWELRY_TYPES: { value: string; label: string }[] = [
  { value: "BELLY_RING", label: "Belly Ring" },
  { value: "NOSE_RING", label: "Nose Ring" },
  { value: "SEPTUM", label: "Septum" },
  { value: "CARTILAGE", label: "Cartilage" },
  { value: "NIPPLE", label: "Nipple" },
  { value: "EAR_LOBE", label: "Ear Lobe" },
  { value: "INDUSTRIAL", label: "Industrial" },
  { value: "LABRET", label: "Labret" },
  { value: "AFTERCARE", label: "Aftercare" },
  { value: "ELIXIR", label: "Elixir" },
];

export const JEWELRY_TYPE_VALUES = JEWELRY_TYPES.map((t) => t.value);

export type ProductFormData = {
  name: string;
  sku: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  reorder: number;
  categoryId: string;
  jewelryType: string;
  material: string;
  featured: boolean;
  active: boolean;
  imageUrl: string;
};
