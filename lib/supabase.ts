import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY!

// Client with service role for server-side operations
export const supabase = createClient(supabaseUrl, serviceRoleKey)
// Client for client-side operations
export const supabaseClient = createClient(supabaseUrl, supabaseKey) 
