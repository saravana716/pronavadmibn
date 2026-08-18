import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cmdudgrmwpkvgsvgecry.supabase.co';
const supabaseAnonKey = 'sb_publishable_ApMOkdERjWnUMRqwJ_1x0w_adfYnYw2';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const BUCKET_NAME = 'pranav-assets';
