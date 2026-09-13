'use server';

import { revalidatePath } from 'next/cache';
import { mockDb } from '@/lib/supabase/mock-data';
import { Category, Product } from '@/types/database';

export async function getMenuCatalogAction(): Promise<{
  categories: Category[];
  products: Product[];
}> {
  return {
    categories: [...mockDb.categories],
    products: [...mockDb.products],
  };
}

export async function toggleProductAvailabilityAction(
  productId: string,
  newAvailability: boolean
): Promise<boolean> {
  const idx = mockDb.products.findIndex((p) => p.id === productId);
  if (idx !== -1) {
    mockDb.products[idx].is_available = newAvailability;
    revalidatePath('/menu');
    revalidatePath('/orders');
    return true;
  }
  return false;
}
