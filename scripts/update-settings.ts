
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function updateSettings() {
    console.log('Updating Supabase Settings...')

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('Missing Supabase credentials')
        return
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Upsert the ai_provider setting
    const { error } = await supabase
        .from('settings')
        .upsert({
            key: 'ai_provider',
            value: 'openai',
            updated_at: new Date().toISOString()
        }, { onConflict: 'key' })

    if (error) {
        console.error('Error updating settings:', error)
    } else {
        console.log('Successfully updated ai_provider to "openai"')
    }
}

updateSettings().catch(console.error)
