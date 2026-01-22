
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function checkSettings() {
    console.log('Checking Supabase Settings...')

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('Missing Supabase credentials')
        return
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data, error } = await supabase.from('settings').select('*')

    if (error) {
        console.error('Error fetching settings:', error)
    } else {
        console.log('Current Settings:', data)
    }
}

checkSettings().catch(console.error)
