export default {
  async fetch(req, env) {
    // Telegram က POST ပဲ ပို့တယ်
    if (req.method !== "POST") {
      return new Response("OK")
    }

    let update
    try {
      update = await req.json()
    } catch {
      return new Response("invalid json")
    }

    // Text message မဟုတ်ရင် ignore
    if (!update.message || !update.message.text) {
      return new Response("ignored")
    }

    const chatId = update.message.chat.id
    const userText = update.message.text.trim()

    // =========================
    // /start command (NO AI)
    // =========================
    if (userText === "/start") {
      await fetch(
        `https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: "မင်္ဂလာပါ 🙏\nမေးချင်တာကို ရိုက်ပြီး ပို့နိုင်ပါတယ်။"
          })
        }
      )
      return new Response("ok")
    }

    // =========================
    // Gemini API call
    // =========================
    let replyText = "ခဏလေး ပြန်စမ်းကြည့်ပါနော် 🙏"

    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
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
                      "User: " +
                      userText
                  }
                ]
              }
            ]
          })
        }
      )

      const data = await geminiRes.json()

      replyText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ??
        replyText
    } catch (err) {
      // Gemini error → fallback
      replyText = "AI ဆက်သွယ်မှု ပြဿနာရှိပါတယ် 🙏 ခဏနောက် ပြန်စမ်းပါနော်"
    }

    // =========================
    // Send reply to Telegram
    // =========================
    await fetch(
      `https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: replyText
        })
      }
    )

    return new Response("ok")
  }
}
