import { NextResponse } from 'next/server'
const APPS_URL = 'https://script.google.com/macros/s/AKfycbzePVPJ0_1xbSze5wDXY61OqrOl6IVtNYpUUk_4CzrodhMZcJtla3iyTinQ-KLUMWW4/exec'
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const params = searchParams.toString()
  const url = params ? `${APPS_URL}?${params}` : APPS_URL
  const res = await fetch(url)
  const data = await res.json()
  return NextResponse.json(data)
}
