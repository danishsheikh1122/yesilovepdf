import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pdfName, actionType, fileSize } = body;

    // Get client IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Validate required fields
    if (!actionType) {
      return NextResponse.json(
        { error: 'actionType is required' },
        { status: 400 }
      );
    }

    // Create the log entry
    const logEntry = {
      ip_address: ip,
      pdf_name: pdfName || 'unknown.pdf',
      action_type: actionType,
      user_agent: userAgent,
      file_size: fileSize || null,
    };

    // Insert into Supabase
    const { data, error } = await supabase
      .from('pdf_usage_logs')
      .insert([logEntry])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to log PDF usage' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'PDF action logged successfully',
        logged: {
          action: actionType,
          filename: pdfName,
          timestamp: new Date().toISOString()
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error logging PDF usage:', error);
    return NextResponse.json(
      { error: 'Failed to log PDF usage' },
      { status: 500 }
    );
  }
}