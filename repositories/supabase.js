import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabasseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabasseKey) {
    throw new Error("SUPABASE_URL and SUPABASE_KEY are required");
}

const supabase = createClient(supabaseUrl, supabasseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
    },
});

export default supabase;