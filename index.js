import dotenv from "dotenv";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { OpenAIAdapter } from "@copilotkit/backend";
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const openaiAdapter = new OpenAIAdapter({
  openai,
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}!`);
});

client.on(Events.MessageCreate, async (readyClient) => {
  if (readyClient.author.bot) return;
  if (!readyClient.mentions.has(client.user?.id || "")) return;

  const userMessage = readyClient.content.replace(/<@\d+>/g, "").trim();

  const decoder = new TextDecoder("utf-8");

  try {
    console.log("User message:", userMessage);
    const copilotkitResponse = await openaiAdapter.getResponse({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant for user queries.",
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    let fullResponse = "";
    const reader = copilotkitResponse.stream.getReader();

    const initialMsgResponse = await readyClient.reply("Hang on a little...");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunkString = decoder.decode(value);

      try {
        const chunkData = JSON.parse(chunkString);

        if (
          chunkData.choices &&
          chunkData.choices[0] &&
          chunkData.choices[0].delta &&
          chunkData.choices[0].delta.content
        ) {
          const contentChunk = chunkData.choices[0].delta.content;
          fullResponse += contentChunk;
        }
      } catch (error) {
        console.error("Error parsing JSON chunk:", error);
      }
    }

    console.log("AI response:", fullResponse);

    initialMsgResponse.edit(fullResponse);
  } catch (error) {
    console.error("Error generating AI response:", error);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
