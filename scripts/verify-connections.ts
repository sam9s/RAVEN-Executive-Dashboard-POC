
import { createClient } from '@supabase/supabase-js'
import axios from 'axios'
import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

async function verifySupabase() {
    console.log('\n--- Verifying Supabase ---')
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.log('❌ Supabase keys missing')
        return
    }

    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        )
        const { data, error } = await supabase.from('settings').select('*').limit(1)
        if (error) throw error
        console.log('SUCCESS: Supabase Connection')
    } catch (error: any) {
        console.log('FAILED: Supabase Connection', error.message)
    }
}

async function verifyOpenAI() {
    console.log('\n--- Verifying OpenAI ---')
    if (!process.env.OPENAI_API_KEY) {
        console.log('FAILED: OpenAI API Key missing')
        return
    }

    try {
        await axios.get('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
        })
        console.log('SUCCESS: OpenAI Connection')
    } catch (error: any) {
        console.log('FAILED: OpenAI Connection', error.response?.data?.error?.message || error.message)
    }
}

async function verifyClickUp() {
    console.log('\n--- Verifying ClickUp ---')
    if (!process.env.CLICKUP_API_TOKEN) {
        console.log('FAILED: ClickUp API Token missing')
        return
    }

    try {
        const response = await axios.get('https://api.clickup.com/api/v2/user', {
            headers: { 'Authorization': process.env.CLICKUP_API_TOKEN }
        })
        console.log(`SUCCESS: ClickUp Connection (User: ${response.data.user.username})`)
    } catch (error: any) {
        console.log('FAILED: ClickUp Connection', error.response?.data?.err || error.message)
    }
}

async function main() {
    console.log('Starting Connection Verification...')
    await verifySupabase()
    await verifyOpenAI()
    await verifyClickUp()
    console.log('\nVerification Complete.')
}

main().catch(console.error)
