export default {
  async fetch(req, env) {
    if (req.method !== "POST") {
      return new Response("OK")
    }

    const update = await req.json()

    if (!update.message || !update.message.text) {
      return new Response("ignored")
    }

    const chatId = update.message.chat.id
    const userText = update.message.text

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `သင်သည် မြန်မာစကားကို သဘာဝကျကျ ပြန်ဖြေတတ်သော Telegram bot ဖြစ်သည်။\nUser: ${userText}`
            }]
          }]
        })
      }
    )

    const data = await geminiRes.json()
    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ??
      "ခဏလေး ပြန်စမ်းကြည့်ပါနော် 🙏"

    await fetch(
      `https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: reply
        })
      }
    )

    return new Response("ok")
  }
}
