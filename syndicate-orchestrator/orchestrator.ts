// Importa as ferramentas necessárias
import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import axios from "axios";
import * as dotenv from "dotenv";
import readline from "readline";
import fs from 'fs/promises';
import path from 'path';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// --- Configuração ---
const geminiApiKey = process.env.GEMINI_API_KEY;
const vaultApiToken = process.env.VAULT_API_TOKEN; 
const vaultApiUrl = "https://vault-beta-jet.vercel.app/api";

// --- Definição das Ferramentas ---
const tools: any = [
  {
    functionDeclarations: [
      {
        name: "vaultApiSearch",
        description: "Busca por um termo ou tag na memória do Vault do Syndicate.",
        parameters: {
          type: "OBJECT",
          properties: {
            tag: { type: "STRING", description: "O termo a ser pesquisado." },
          },
          required: ["tag"],
        },
      },
      {
        name: "vaultApiIngest",
        description: "Salva (ingestiona) um novo registro de dados no Vault do Syndicate.",
        parameters: {
          type: "OBJECT",
          properties: {
            tipo_registro: { type: "STRING", description: "O tipo de registro, ex: 'evidencia', 'hipotese'." },
            autor: { type: "STRING", "description": "O especialista que gerou o dado, ex: 'estrategista_chefe'." },
            dados: { type: "OBJECT", description: "Um objeto contendo o conteúdo a ser salvo." }
          },
          required: ["tipo_registro", "autor", "dados"],
        },
      },
    ],
  },
];

// --- Função para ler os arquivos de sistema ---
async function buildSystemKnowledge(): Promise<Part[]> {
  console.log("🧠 Lendo manuais e dossiês do Syndicate...");
  const filesToRead = [
    'agent-prompt.md', 'agent-config.yaml', 'lore.md', 'persona.md', 
    'pipeline_engine.md', 'qa_refinement.md', 'validation_engine.md', 
    'retry_protocols.md', 'quality_validators.md', 'analysis_schemas.yaml',
    'tasks.md', 'templates.md', 'checklists.md'
  ];
  
  const systemKnowledgeParts: Part[] = [];

  for (const file of filesToRead) {
    try {
      const content = await fs.readFile(path.join('system_files', file), 'utf-8');
      systemKnowledgeParts.push({ text: `--- INÍCIO DO ARQUIVO: ${file} ---\n\n${content}\n\n--- FIM DO ARQUIVO: ${file} ---` });
    } catch (error) {
      console.warn(`⚠️ Aviso: Falha ao ler o arquivo de sistema opcional: ${file}`);
    }
  }
  
  console.log(`✅ ${systemKnowledgeParts.length} documentos do sistema carregados na memória.`);
  return systemKnowledgeParts;
}


// --- Função Principal do Orquestrador ---
async function runOrchestrator() {
  if (!geminiApiKey || !vaultApiToken) {
    console.error("❌ ERRO: Verifique as variáveis GEMINI_API_KEY e VAULT_API_TOKEN no seu arquivo .env");
    return;
  }

  const systemInstruction = await buildSystemKnowledge();
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-pro-latest", 
    tools,
    systemInstruction: { role: "system", parts: systemInstruction }
  });

  const chat = model.startChat();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log("\n--- Centro de Comando Syndicate v2.1 ---");
  console.log("Capitão Obi a postos. Contexto carregado. Aguardando sua diretriz, Simon.");
  rl.prompt();

  for await (const userInput of rl) {
    try {
      const result = await chat.sendMessage(userInput);
      const response = result.response;
      const functionCalls = response.functionCalls();

      if (!functionCalls || functionCalls.length === 0) {
        console.log("\n[OBI]:", response.text());
      } else {
        console.log("\n[OBI]: Recebida ordem para usar uma ferramenta. Executando...");

        const responses: any[] = [];

        for (const funcCall of functionCalls) {
            const { name, args } = funcCall;
            let apiResponse;

            console.log(`> Executando ferramenta: ${name}`);
            
            if (name === 'vaultApiSearch') {
                const searchArgs = args as { tag: string };
                const { data } = await axios.get(`${vaultApiUrl}/search?tag=${searchArgs.tag}`, {
                    headers: { 'Authorization': `Bearer ${vaultApiToken}` }
                });
                apiResponse = data;

            } else if (name === 'vaultApiIngest') {
                const ingestArgs = args as { tipo_registro: string; autor: string; dados: object; };
                const { data } = await axios.post(`${vaultApiUrl}/ingest`, 
                    { tipo_registro: ingestArgs.tipo_registro, autor: ingestArgs.autor, dados: ingestArgs.dados },
                    { headers: { 'Authorization': `Bearer ${vaultApiToken}` } }
                );
                apiResponse = data;
            }
            
            responses.push({ functionResponse: { name, response: apiResponse } });
        }
        
        const resultWithToolResponse = await chat.sendMessage(responses);
        console.log("\n[OBI]:", resultWithToolResponse.response.text());
      }
    } catch (error: any) {
        console.error("\n❌ Ocorreu um erro na operação:", error.response?.data || error.message || error);
    }
    rl.prompt();
  }
}

// Inicia a operação
runOrchestrator();