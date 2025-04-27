import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY!

// console.log("Supabase URL:", supabaseUrl)
// console.log("Supabase Anon Key:", supabaseKey)
// console.log("Supabase Service Role Key:", serviceRoleKey)

// Client with service role for server-side operations
export const supabase = createClient(supabaseUrl, serviceRoleKey)
// Client for client-side operations
export const supabaseClient = createClient(supabaseUrl, supabaseKey) 

// Client with service role for server-side operations with real-time enabled
// export const supabase = createClient(supabaseUrl, serviceRoleKey, {
//   realtime: {
//     // Configure real-time settings here if needed
//     params: {
//       eventsPerSecond: 10
//     }
//   }
// })

// Client for client-side operations with real-time enabled
// export const supabaseClient = createClient(supabaseUrl, supabaseKey, {
//   realtime: {
//     params: {
//       eventsPerSecond: 10
//     }
//   }
// })

// Helper function to connect to real-time
// export const connectToRealtime = () => {
//   // Explicitly connect to the realtime service
//   supabase.realtime.connect()
  
//   return supabase
// } 