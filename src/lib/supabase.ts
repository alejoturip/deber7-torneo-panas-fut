import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.warn('Faltan las variables EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY en el archivo .env');
}

// La app no tiene login, por eso no se guarda sesión
export const supabase = createClient(url ?? '', key ?? '', {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
