import { NextResponse } from 'next/server'
import { runHealthCheckSuite } from '@/lib/health-checker'

export async function GET() {
  return handleRun()
}

export async function POST() {
  return handleRun()
}

async function handleRun() {
  try {
    const report = await runHealthCheckSuite()
    return NextResponse.json(report, {
      status: report.isHealthy ? 200 : 207
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Lỗi kiểm thử hệ thống không xác định'
      },
      { status: 500 }
    )
  }
}
