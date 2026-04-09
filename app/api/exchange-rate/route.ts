export const runtime = "nodejs"

type ExchangeRateResponse = {
  rates?: Record<string, number>
}

function isValidCurrencyCode(value: string | null): value is string {
  return Boolean(value && /^[A-Z]{3}$/.test(value))
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  if (!isValidCurrencyCode(from) || !isValidCurrencyCode(to)) {
    return Response.json(
      { error: "Invalid currency code." },
      { status: 400 }
    )
  }

  if (from === to) {
    return Response.json({ rate: 1 })
  }

  const upstream = await fetch(
    `https://api.frankfurter.app/latest?from=${from}&to=${to}`,
    { cache: "no-store" }
  )

  if (!upstream.ok) {
    return Response.json(
      { error: "Failed to fetch exchange rate." },
      { status: 502 }
    )
  }

  const data = (await upstream.json()) as ExchangeRateResponse
  const rate = data.rates?.[to]

  if (!rate) {
    return Response.json({ error: "Exchange rate unavailable." }, { status: 404 })
  }

  return Response.json({ rate })
}
