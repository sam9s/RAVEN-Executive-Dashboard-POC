
import axios from 'axios'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const CLICKUP_API_URL = 'https://api.clickup.com/api/v2'

async function listSpaces() {
    const logFile = path.resolve(process.cwd(), 'clickup_spaces.txt')
    const log = (msg: string) => {
        console.log(msg)
        fs.appendFileSync(logFile, msg + '\n')
    }

    // Clear file
    fs.writeFileSync(logFile, 'Starting ClickUp Space Fetch (using axios direct)...\n')

    const token = process.env.CLICKUP_API_TOKEN
    if (!token) {
        log('Error: CLICKUP_API_TOKEN is not set in .env.local')
        return
    }

    const headers = {
        'Authorization': token,
        'Content-Type': 'application/json'
    }

    try {
        // 1. Get Teams (Workspaces)
        log('Fetching Teams...')
        const teamsRes = await axios.get(`${CLICKUP_API_URL}/team`, { headers })
        const teams = teamsRes.data.teams

        if (!teams || teams.length === 0) {
            log('No teams found found.')
            return
        }

        log(`Found ${teams.length} Team(s):`)

        for (const team of teams) {
            log(`\nTeam: ${team.name} (ID: ${team.id})`)

            // 2. Get Spaces for this Team
            try {
                const spacesRes = await axios.get(`${CLICKUP_API_URL}/team/${team.id}/space`, { headers })
                const spaces = spacesRes.data.spaces

                if (spaces && spaces.length > 0) {
                    log('Available Spaces:')
                    spaces.forEach((space: any) => {
                        log(`- Name: "${space.name}" | ID: ${space.id}`)
                    })
                } else {
                    log('No spaces found in this team.')
                }
            } catch (spaceErr: any) {
                log(`Failed to fetch spaces for team ${team.id}: ${spaceErr.message}`)
            }
        }
    } catch (error: any) {
        log(`Error fetching teams: ${error.message}`)
        if (error.response) {
            log(`Response: ${JSON.stringify(error.response.data)}`)
        }
    }
}

listSpaces().catch(e => {
    console.error(e)
    fs.appendFileSync('clickup_spaces.txt', `Fatal Error: ${e.message}\n`)
})
