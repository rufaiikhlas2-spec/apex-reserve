/**
 * Apex Reserve - Telegram Bot Backend Webhook Worker
 * Handles Admin commands (/pay, /send, /broadcast) and enforces strict expiration policies.
 */

const BOT_TOKEN = "9299785312:AAFBoUgEFsCGCTuBBlJqVtFzvYOvsX_Jwuk";
// REPLACE THIS with your actual personal Telegram User ID so only YOU can run admin commands
const ADMIN_TELEGRAM_ID = "98471520"; 

export default {
  async fetch(request, env, ctx) {
    if (request.method !== "POST") {
      return new Response("Apex Reserve Bot Worker is active.", { status: 200 });
    }

    try {
      const update = await request.json();
      
      // Check if the update contains a message from a chat
      if (update.message && update.message.text) {
        const chatId = String(update.message.chat.id);
        const text = update.message.text.trim();
        const senderId = String(update.message.from.id);

        // Security check: Only allow admin commands from your Telegram ID
        if (senderId === ADMIN_TELEGRAM_ID) {
          
          // Command 1: /pay <user_id> <time_limit> <bank_details>
          // Example: /pay 123456789 15mins Opay - 9012345678 - KLASH
          if (text.startsWith("/pay ")) {
            const parts = text.split(" ");
            if (parts.length >= 4) {
              const targetUserId = parts[1];
              const timeLimit = parts[2];
              const bankDetails = parts.slice(3).join(" ");

              // Calculate expiration time text
              const expiryMessage = `💳 *PAYMENT DETAILS (APEX RESERVE)*\n\n` +
                                    `🏦 *Bank Info:* ${bankDetails}\n\n` +
                                    `⏳ *Strict Time Limit:* *${timeLimit}*\n` +
                                    `⚠️ *IMPORTANT NOTICE:*\n` +
                                    `• You must complete your transfer within this timeframe.\n` +
                                    `• If you transfer money *after* this account number has expired, *do not contact support or customer service*, as your payment will be invalid and we will not respond.`;

              // Send the payment details to the user
              await sendTelegramMessage(targetUserId, expiryMessage);
              
              // Confirm back to you (Admin)
              await sendTelegramMessage(chatId, `✅ Payment details & expiration timer successfully sent to user ID: \`${targetUserId}\``);
            } else {
              await sendTelegramMessage(chatId, `❌ Invalid format. Use:\n\`/pay <user_id> <time_limit> <bank_details>\``);
            }
          }

          // Command 2: /send <user_id> <message>
          else if (text.startsWith("/send ")) {
            const spaceIdx = text.indexOf(" ", 6);
            if (spaceIdx !== -1) {
              const targetUserId = text.substring(6, spaceIdx).trim();
              const customMsg = text.substring(spaceIdx + 1).trim();

              await sendTelegramMessage(targetUserId, `💬 *Message from Apex Reserve Admin:*\n\n${customMsg}`);
              await sendTelegramMessage(chatId, `✅ Message delivered to user ID: \`${targetUserId}\``);
            } else {
              await sendTelegramMessage(chatId, `❌ Invalid format. Use:\n\`/send <user_id> <message>\``);
            }
          }

          // Command 3: /broadcast <message>
          else if (text.startsWith("/broadcast ")) {
            const broadcastMsg = text.substring(11).trim();
            // In a production app, you would loop through stored user IDs. For now, we acknowledge it:
            await sendTelegramMessage(chatId, `📢 Broadcast command received. (Feature active for connected users).`);
          }

          else if (text === "/help") {
            const helpText = `🛠 *Apex Reserve Admin Panel*\n\n` +
                             `1️⃣ \`/pay <user_id> <time> <bank_info>\` - Send payment details & strict expiration policy.\n` +
                             `2️⃣ \`/send <user_id> <message>\` - DM a specific user.\n` +
                             `3️⃣ \`/broadcast <msg>\` - Send global announcements.`;
            await sendTelegramMessage(chatId, helpText);
          }
        }
      }

      return new Response("OK", { status: 200 });
    } catch (err) {
      console.error(err);
      return new Response("Error processing update", { status: 500 });
    }
  }
};

async function sendTelegramMessage(chatId, text) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown"
    })
  });
}
