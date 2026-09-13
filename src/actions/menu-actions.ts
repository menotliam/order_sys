'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { writeAuditLog } from '@/lib/supabase/context';
import { Category, Product } from '@/types/database';

export async function getMenuCatalogAction(): Promise<{
  categories: Category[];
  products: Product[];
}> {
  const supabase = createAdminClient();

  const [categoriesRes, productsRes] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('products').select('*').order('sort_order'),
  ]);

  return {
    categories: (categoriesRes.data ?? []) as Category[],
    products: (productsRes.data ?? []) as Product[],
  };
}

export async function toggleProductAvailabilityAction(
  productId: string,
  newAvailability: boolean
): Promise<boolean> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('products')
    .update({ is_available: newAvailability })
    .eq('id', productId)
    .select('id, store_id, name, is_available')
    .maybeSingle();

  if (error || !data) return false;

  // Specified as MENU_ITEM_STOCK_TOGGLED: staff turning an item off by
  // mistake silently blocks sales, so the change needs an audit trail.
  await writeAuditLog({
    store_id: data.store_id,
    event_type: 'MENU_ITEM_STOCK_TOGGLED',
    category: 'INTEGRITY',
    severity: 'INFO',
    actor_type: 'staff',
    message: `${data.name} được chuyển sang trạng thái ${
      newAvailability ? 'Còn hàng' : 'Hết hàng'
    }.`,
    metadata: {
      item_id: data.id,
      item_name: data.name,
      previous_status: !newAvailability,
      new_status: newAvailability,
    },
  });

  revalidatePath('/menu');
  revalidatePath('/menu-manage');
  revalidatePath('/orders');
  return true;
}
