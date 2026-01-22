import { NextRequest, NextResponse } from 'next/server'
import { getAuthUrl, getTokens } from '@/lib/integrations/gmail-oauth'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const tokensExist = getTokens()

        if (tokensExist) {
            return NextResponse.json({
                success: true,
                authenticated: true
            })
        }

        const authUrl = getAuthUrl()

        return NextResponse.json({
            success: true,
            authenticated: false,
            authUrl
        })
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
