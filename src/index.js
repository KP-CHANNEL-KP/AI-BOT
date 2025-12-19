export default {
  async fetch(req, env) {
    if (req.method !== "POST") return new Response("OK")

    const update = await req.json()
    if (!update.message || !update.message.text) {
      return new Response("ignored")
    }

    const chatId = update.message.chat.id
    const userText = update.message.text.trim()

    // /start
    if (userText === "/start") {
      await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "မင်္ဂလာပါ 🙏\nမေးချင်တာကို ရိုက်ပြီး ပို့နိုင်ပါတယ်။"
        })
      })
      return new Response("ok")
    }

    let replyText = "ခဏလေး ပြန်စမ်းကြည့်ပါနော် 🙏"

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" +
        env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    "သင်သည် မြန်မာစကားကို သဘာဝကျကျ နားလည်ပြီး " +
                    "Telegram bot အဖြစ် ရိုးရှင်းသန့်ရှင်းစွာ ပြန်ဖြေပေးရမည်။\n\n" +
                    userText
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 512
          }
        })
      }
    )

    const data = await res.json()

    replyText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "Gemini က စာမပြန်ပါ 🙏"

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
