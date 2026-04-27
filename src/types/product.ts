export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  image_url: string;
  badge: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
