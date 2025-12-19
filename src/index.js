export default {
  async fetch(req, env) {
    if (req.method !== "POST") return new Response("OK")

    const update = await req.json()
    if (!update.message || !update.message.text) {
      return new Response("ignored")
    }

    const chatId = update.message.chat.id
    const userText = update.message.text.trim()

    let replyText = "fallback"

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" +
        env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userText }] }]
        })
      }
    )

    console.log("Gemini HTTP status:", res.status)

    const raw = await res.text()
    console.log("Gemini RAW:", raw)

    try {
      const data = JSON.parse(raw)
      replyText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ??
        "NO CANDIDATES"
    } catch {
      replyText = "JSON PARSE ERROR"
    }

    await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: replyText
      })
    })

    return new Response("ok")
  }
}
