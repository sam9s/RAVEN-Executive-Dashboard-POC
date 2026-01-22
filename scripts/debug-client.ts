
import dotenv from 'dotenv'
import path from 'path'

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

import { clickupClient } from '../lib/integrations/clickup'

async function test() {
    console.log('Testing ClickUp Client...')
    console.log('Token exists:', !!process.env.CLICKUP_API_TOKEN)

    const result = await clickupClient.testConnection()
    console.log('Result:', result)
}

test()
