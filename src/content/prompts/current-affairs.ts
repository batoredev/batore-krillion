import { p } from "../types";
const T = "current-affairs";
// Keep these to facts that change slowly. Review membership lists periodically.
export default [
  p("ca-g20", T, "Name a member of the G20", {
    ground: "India; United States|usa|us|america; China; Japan; United Kingdom|uk|britain; Russia",
    decoy: "European Union|eu",
    orbit: "Germany; France; Brazil; Canada; Australia; Italy; South Africa; Saudi Arabia; Indonesia; South Korea|korea|republic of korea; Mexico",
    moonshot: "Argentina",
    deep: "Turkey|turkiye",
    gem: "African Union|au",
  }),
  p("ca-eu", T, "Name a European Union member state", {
    ground: "France; Germany; Italy; Spain; Netherlands|holland",
    decoy: "Switzerland",
    orbit: "Belgium; Portugal; Greece; Austria; Ireland; Sweden; Denmark; Finland; Poland; Czech Republic|czechia; Hungary",
    moonshot: "Romania; Bulgaria; Croatia; Slovakia; Slovenia; Lithuania; Latvia; Estonia; Luxembourg",
    deep: "Malta; Cyprus",
    gem: "Malta",
  }),
  p("ca-brics", T, "Name a BRICS member country", {
    ground: "India; China; Russia; Brazil; South Africa",
    decoy: "",
    orbit: "Iran; Egypt; United Arab Emirates|uae",
    moonshot: "Ethiopia; Indonesia",
    deep: "Saudi Arabia",
    gem: "Ethiopia",
  }),
  p("ca-nato", T, "Name a NATO member country", {
    ground: "United States|usa|us|america; United Kingdom|uk|britain; France; Germany; Canada",
    decoy: "",
    orbit: "Italy; Spain; Turkey|turkiye; Poland; Netherlands|holland; Belgium; Norway; Denmark; Portugal; Greece; Finland; Sweden",
    moonshot: "Romania; Hungary; Czech Republic|czechia; Bulgaria; Croatia; Slovakia; Slovenia; Lithuania; Latvia; Estonia; Iceland; Luxembourg",
    deep: "Albania; North Macedonia|macedonia; Montenegro",
    gem: "Iceland",
  }),
  p("ca-social", T, "Name a social media or messaging app", {
    ground: "Instagram; Facebook; WhatsApp; YouTube; X|twitter; Snapchat",
    decoy: "TikTok",
    orbit: "LinkedIn; Telegram; Reddit; Pinterest; Threads; Discord; Signal; Messenger|facebook messenger; WeChat; Tumblr; Quora; Twitch; Koo; ShareChat; Moj; Josh",
    moonshot: "Bluesky; Mastodon; BeReal; Clubhouse; Line; Viber; Kakao Talk|kakaotalk; Weibo; Douyin; Xiaohongshu|rednote; VK|vkontakte; Truth Social; Hike; Roposo; Chingari",
    deep: "Orkut; MySpace; Friendster; Google Plus|google+; Vine; Periscope; Path; Ello; Gab; Parler; Gettr; Minds; Diaspora; Nextdoor; Lemon8; Yik Yak; Ask.fm|askfm; Hi5; Bebo; ICQ; MSN Messenger|windows live messenger; Yahoo Messenger; Google Buzz",
    gem: "Orkut",
  }),
  p("ca-ai", T, "Name an AI chatbot or AI company", {
    ground: "ChatGPT; OpenAI; Google Gemini|gemini; Claude; Microsoft Copilot|copilot",
    decoy: "Siri; Alexa",
    orbit: "Anthropic; Google DeepMind|deepmind; Meta AI; Llama; Perplexity; Grok; xAI; Mistral; DeepSeek; Midjourney; DALL-E|dall e; Nvidia; Bard; Hugging Face",
    moonshot: "Stability AI|stable diffusion; Cohere; Character.AI|character ai; Inflection|pi; Runway; Sora; Qwen|alibaba qwen; Ernie|ernie bot; Kimi|moonshot ai; Krutrim; Sarvam AI|sarvam; Jasper; Scale AI; Groq; Cerebras",
    deep: "Aleph Alpha; AI21 Labs|ai21; Reka; Adept; Magic; Poolside; Sakana AI|sakana; 01.AI|01 ai|yi; Zhipu|glm; MiniMax; Baichuan; BharatGPT; CoRover; Hanooman; Ola Krutrim; Eliza; ALICE; Tay; Watson|ibm watson; Cleverbot; SmarterChild",
    gem: "ELIZA",
  }),
  p("ca-olympics", T, "Name a city that has hosted the Summer Olympics", {
    ground: "Paris; London; Tokyo; Beijing; Los Angeles|la; Rio de Janeiro|rio",
    decoy: "",
    orbit: "Athens; Sydney; Atlanta; Barcelona; Seoul; Moscow",
    moonshot: "Montreal; Munich; Mexico City; Berlin; Rome; Melbourne",
    deep: "Helsinki; Amsterdam; Stockholm; St. Louis|st louis|saint louis",
    gem: "Antwerp",
  }),
  p("ca-crypto", T, "Name a cryptocurrency", {
    ground: "Bitcoin|btc; Ethereum|ether|eth; Dogecoin|doge",
    decoy: "Shiba Inu|shib",
    orbit: "Solana|sol; Ripple|xrp; Cardano|ada; Tether|usdt; Litecoin|ltc; Binance Coin|bnb; Polygon|matic; USD Coin|usdc; Polkadot|dot; Avalanche|avax; Tron|trx; Toncoin|ton",
    moonshot: "Monero|xmr; Chainlink|link; Bitcoin Cash|bch; Stellar|xlm; Cosmos|atom; Uniswap|uni; Pepe; Dai; Near|near protocol; Aptos; Sui; Arbitrum; Filecoin; Algorand; Hedera|hbar; Ethereum Classic|etc; Zcash; Dash",
    deep: "Tezos; EOS; NEO; IOTA; VeChain; Decentraland|mana; The Sandbox|sand; Axie Infinity|axs; Terra|luna; FTT; Namecoin; Peercoin; Nano; Ravencoin; Kaspa; Bonk; Dogwifhat|wif; Worldcoin; Basic Attention Token|bat; WazirX token|wrx",
    gem: "Namecoin",
  }),
];
