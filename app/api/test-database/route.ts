import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/utils/supabaseClient'

export async function GET() {
  try {
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('pdf_usage_logs')
      .select('count')
      .limit(1)

    if (testError) {
      console.error('Database connection test failed:', testError)
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: testError.message
      }, { status: 500 })
    }

    // Test insert capability
    const { data: insertData, error: insertError } = await supabase
      .from('pdf_usage_logs')
      .insert({
        ip_address: '127.0.0.1',
        pdf_name: 'test-connection.pdf',
        action_type: 'test-connection',
        file_size: 1024
      })
      .select()

    if (insertError) {
      console.error('Database insert test failed:', insertError)
      return NextResponse.json({
        success: false,
        error: 'Database insert failed',
        details: insertError.message
      }, { status: 500 })
    }

    // Get basic stats
    const { data: statsData, error: statsError } = await supabase
      .from('pdf_usage_logs')
      .select('*')

    if (statsError) {
      console.error('Database query test failed:', statsError)
      return NextResponse.json({
        success: false,
        error: 'Database query failed',
        details: statsError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection successful!',
      stats: {
        totalRecords: statsData?.length || 0,
        sampleRecord: insertData?.[0] || null,
        lastRecord: statsData?.[statsData.length - 1] || null
      }
    })

  } catch (error) {
    console.error('Unexpected error testing database:', error)
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}