import dotenv from "dotenv";
import { Client, Events, GatewayIntentBits } from "discord.js";

dotenv.config();

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

client.on(Events.MessageCreate, (readyClient) => {
  if (readyClient.author.bot) return;
  if (!readyClient.mentions.has(client.user?.id || "")) return;

  readyClient.content = readyClient.content.replace(/<@\d+>/g, "");

  console.log(readyClient.content.toString());
  readyClient.reply("Responding to" + readyClient.content);
});

client.login(process.env.DISCORD_BOT_TOKEN);
