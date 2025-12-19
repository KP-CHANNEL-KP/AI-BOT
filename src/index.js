export default {
  async fetch(req, env) {
    // POST မဟုတ်ရင် လက်မခံဘူး
    if (req.method !== "POST") return new Response("OK");

    try {
      const update = await req.json();
      
      // Message မပါရင် ဒါမှမဟုတ် text မဟုတ်ရင် ကျော်သွားမယ်
      if (!update.message || !update.message.text) {
        return new Response("OK");
      }

      const chatId = update.message.chat.id;
      const userText = update.message.text.trim();

      // Gemini API ကို လှမ်းခေါ်မယ်
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userText }] }]
          })
        }
      );

      const data = await geminiRes.json();
      
      // Gemini က စာသားပြန်ပေးမပေး စစ်ဆေးမယ်
      let replyText = "စိတ်မရှိပါနဲ့၊ ကျွန်တော် ဒီမေးခွန်းကို မဖြေနိုင်လို့ပါ။";

      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        replyText = data.candidates[0].content.parts[0].text;
      } else if (data.error) {
        // API Key error ဒါမှမဟုတ် တခြား error ရှိရင် log ထုတ်မယ်
        console.error("Gemini Error:", data.error.message);
        replyText = "Error: " + data.error.message;
      }

      // Telegram ဆီ ပြန်ပို့မယ်
      await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: replyText
        })
      });

    } catch (err) {
      console.error("Worker Error:", err.message);
    }

    return new Response("OK");
  }
}
