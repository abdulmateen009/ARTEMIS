import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xsfvlmgqbanweuctuowo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2-DhmLvwW4FRnCIYZ_xDPg_Zec6j61x';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);