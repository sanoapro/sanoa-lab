import 'server-only';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function hasFeatureServer(orgId: string, featureId: string): Promise<boolean> {
  const supa = createServerClient();
  const { data } = await supa
    .from('org_features')
    .select('feature_id')
    .eq('org_id', orgId)
    .eq('feature_id', featureId)
    .maybeSingle();
  return !!data;
}
