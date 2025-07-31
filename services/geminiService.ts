import { GoogleGenAI, GenerateContentResponse, GenerateContentParameters, Content } from "@google/genai";
import { ExtractedData, MaterialUsed } from '../types'; // Added MaterialUsed to ensure type safety
import { GEMINI_MODEL_TEXT } from '../constants';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
console.log('Debug: VITE_GEMINI_API_KEY =', apiKey ? 'SET' : 'NOT SET');
if (!apiKey) {
  console.error("API_KEY for Gemini is not set in environment variables. AI processing will fail.");
}
const ai = new GoogleGenAI({ apiKey: apiKey || "MISSING_API_KEY_FOR_INITIALIZATION" });


// Renumbered rules to start from 1, as OCR instructions will be separate.
const SHARED_JSON_RULES_AND_STRUCTURE = `
1.  A SUA RESPOSTA DEVE SER EXCLUSIVAMENTE UM ÚNICO OBJETO JSON VÁLIDO.
2.  NÃO inclua NENHUM texto explicativo, NENHUMA introdução, NENHUMA observação, e NENHUM markdown (como \`\`\`json). O JSON deve começar com '{' e terminar com '}'.
3.  Se um campo textual (como patientName, procedureName, doctorName, material.description, material.observation) não for encontrado no texto (da imagem ou fornecido), use o valor JSON null para esse campo. NÃO use strings vazias como "".
4.  Para o campo 'materialsUsed': se nenhum material for encontrado, use um array JSON vazio: [].
5.  Quantidades de materiais: Se não explicitamente declaradas no texto (por exemplo, ao lado da descrição do material, ou em uma coluna de quantidade), assuma 1. Se uma quantidade for mencionada (ex: "Quantidade: 2", "Qtd: 1", "2 unidades", "- 2", "x2"), extraia o NÚMERO. O campo 'quantity' DEVE ser um número JSON, não uma string.
6.  Códigos de materiais: Se presentes no texto (ex: "(COD: P-205)" ou "(PL-088)"), extraia APENAS o código (ex: "P-205" ou "PL-088") para o campo "code". Caso contrário, use o valor JSON null para "code".
7.  Números de Lote (LOTE): Se presentes no texto (ex: "LOTE: ABC123", "Lot No. XYZ789", "N Lote: 12345"), extraia o valor para o campo "lotNumber". Seja flexível com a formatação da etiqueta do lote. Caso contrário, use o valor JSON null para "lotNumber".
8.  Observações do Material: Preste atenção especial a anotações manuscritas ou textuais próximas a cada material que indiquem seu status. Procure por palavras-chave como "Contaminado", "Não Implantado", "Defeito", "Danificado", "Quebrado". Se uma dessas palavras-chave for encontrada, inclua uma nota padronizada no campo "observation", por exemplo: "Status Importante: Contaminado". Se houver outras observações gerais (ex: "Material aberto e não utilizado", "Devolvido ao estoque"), inclua-as também. Se múltiplas observações existirem, combine-as. Se nenhuma observação for encontrada, use o valor JSON null para "observation".
9.  Datas: Formate todas as datas como DD/MM/AAAA. Se o ano estiver ausente ou for de dois dígitos, tente inferir o ano completo com base no contexto ou use o ano atual se não houver outra informação. Se a data não puder ser determinada, use null.
10. Para cada material, a DESCRIÇÃO é o campo mais importante. Garanta que a descrição completa e precisa seja extraída. Código e Lote são secundários mas importantes se presentes.
11. JSON Syntax:
    a.  Todas as chaves e valores de string DEVEM estar entre aspas duplas (").
    b.  Use vírgulas (,) para separar pares chave-valor dentro de um objeto.
    c.  Use vírgulas (,) para separar objetos dentro de um array (como em 'materialsUsed').
    d.  NÃO coloque vírgula após o último par chave-valor em um objeto ou após o último elemento em um array.
    e.  Garanta que todas as aspas duplas (") DENTRO de um valor de string sejam devidamente escapadas com uma barra invertida (\\"), por exemplo: "Procedimento com \\"detalhes\\"".

A ESTRUTURA EXATA DO OBJETO JSON DEVE SER:
{
  "patientName": "string_ou_null",
  "patientDOB": "DD/MM/AAAA_ou_null",
  "surgeryDate": "DD/MM/AAAA_ou_null",
  "procedureName": "string_ou_null",
  "doctorName": "string_ou_null",
  "materialsUsed": [
    { "description": "string", "quantity": numero_inteiro, "code": "string_ou_null", "lotNumber": "string_ou_null", "observation": "string_ou_null" }
  ]
}
`;

const PROMPT_FOR_IMAGE_CASE_TEMPLATE = `
Você recebeu uma imagem de um documento hospitalar de controle de OPME. Siga as instruções abaixo para extrair os dados:

1. **DADOS DO PACIENTE, MÉDICO, PROCEDIMENTO, DATA DE NASCIMENTO E DATA DE CIRURGIA:**
   - Sempre localize essas informações no TOPO da imagem, independentemente da orientação (paisagem ou retrato).
   - Se a imagem estiver de lado, considere o topo visual da imagem como referência.
   - Extraia exatamente como está escrito, corrigindo apenas erros óbvios de OCR.

2. **MATERIAIS UTILIZADOS:**
   - Os materiais SEMPRE aparecem na parte do MEIO do documento, dentro de uma forma geométrica (geralmente um QUADRADO).
   - Cada material pode estar em uma ETIQUETA (com código, lote, fabricante, etc.) ou escrito à mão (letra de forma ou cursiva).
   - Para cada material, extraia:
     - Descrição completa
     - Código (se houver)
     - Lote (se houver)
     - Fabricante (se houver)
     - Observações manuscritas próximas
   - Se o material estiver escrito à mão, tente transcrever com máxima precisão, mesmo que a letra seja difícil.

3. **PADRÕES DE FORMATO:**
   - Datas: sempre no formato DD/MM/AAAA.
   - Códigos e lotes: extraia exatamente como aparecem, mesmo que estejam em etiquetas ou manuscritos.

4. **EXTRAÇÃO ESTRUTURADA:**
   - Retorne os dados em JSON conforme o modelo abaixo.
   - Se algum campo não for encontrado, use null.

5. **CUIDADO COM AMBIGUIDADES DE CARACTERES:**
   - Diferencie cuidadosamente caracteres que podem ser confundidos (ex: '0' e 'O', '1' e 'l'/'I', '5' e 'S', '8' e 'B'). Use o contexto (ex: códigos de material geralmente usam números, datas usam números) para decidir o caractere correto.

6. **SEÇÕES MANUSCRITAS:**
   - Textos manuscritos exigem atenção redobrada. Transcreva-os com a maior precisão possível. Se uma informação CRÍTICA (como nome do paciente ou descrição de um material principal) estiver manuscrita e for COMPLETAMENTE ILEGÍVEL, use o valor null para o campo correspondente no JSON.

{{USER_PROVIDED_TEXT_BLOCK_PLACEHOLDER}}

REGRAS ESTRITAS PARA A SAÍDA JSON (aplicadas AO TEXTO EXTRAÍDO PELA ETAPA DE OCR):
${SHARED_JSON_RULES_AND_STRUCTURE}

JSON Output:
`;

// PROMPT_FOR_TEXT_ONLY_CASE_TEMPLATE uses SHARED_JSON_RULES_AND_STRUCTURE which is now renumbered.
const PROMPT_FOR_TEXT_ONLY_CASE_TEMPLATE = `
Analise o seguinte texto de um documento de consumo hospitalar. Sua tarefa é extrair as informações do paciente, detalhes da cirurgia e materiais utilizados, incluindo números de lote e quaisquer observações específicas sobre os materiais.

REGRAS ESTRITAS PARA A SAÍDA JSON:
${SHARED_JSON_RULES_AND_STRUCTURE}

Conteúdo do Documento (Texto Fornecido):
---
{{DOCUMENT_TEXT}}
---

JSON Output:
`;


export async function extractOrderDetailsFromText(
  documentText?: string, 
  imageBase64?: string, 
  imageMimeType?: string,
  supplementaryUserText?: string
): Promise<ExtractedData> {
  if (!apiKey) {
    throw new Error("Gemini API key is not configured. Cannot process document.");
  }

  if (!documentText && !imageBase64) {
    throw new Error("Nenhum documento (texto ou imagem) fornecido para processamento.");
  }

  let requestPayloadContents: string | Content;
  let modelConfig: GenerateContentParameters['config'];
  let isImageInput = false;

  if (imageBase64 && imageMimeType) {
    isImageInput = true;
    if (!imageBase64 || !imageMimeType) {
        throw new Error("Dados da imagem base64 ou mimetype ausentes para processamento de imagem.");
    }
    const imagePart = { inlineData: { mimeType: imageMimeType, data: imageBase64 } };
    
    let userTextBlockContent = "";
    if (supplementaryUserText && supplementaryUserText.trim() !== "") {
      userTextBlockContent = `
    e.  TEXTO SUPLEMENTAR FORNECIDO PELO USUÁRIO: O texto abaixo foi fornecido pelo usuário. Considere-o como notas ou contexto adicional APÓS analisar a imagem. A informação da imagem é sempre prioritária.
        TEXTO ADICIONAL DO USUÁRIO:
        ---
        ${supplementaryUserText.trim()}
        ---`;
    }
    
    const finalPromptForImage = PROMPT_FOR_IMAGE_CASE_TEMPLATE.replace("{{USER_PROVIDED_TEXT_BLOCK_PLACEHOLDER}}", userTextBlockContent);
    
    requestPayloadContents = { parts: [imagePart, { text: finalPromptForImage }] };
    modelConfig = { 
      temperature: 0.1, 
      topP: 0.9,
      topK: 5, 
    };

  } else if (documentText) {
    const promptForText = PROMPT_FOR_TEXT_ONLY_CASE_TEMPLATE.replace("{{DOCUMENT_TEXT}}", documentText);
    requestPayloadContents = promptForText;
    modelConfig = { 
      responseMimeType: "application/json", 
      temperature: 0.05,
      topP: 0.9,
      topK: 1
    };
  } else {
    throw new Error("Dados insuficientes para processamento (nem texto, nem imagem).");
  }
  
  let rawResponseText = ""; 
  let jsonStrToParse = ""; 

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: requestPayloadContents,
        config: modelConfig
    });
    
    rawResponseText = response.text ?? ""; 
    jsonStrToParse = rawResponseText.trim();

    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStrToParse.match(fenceRegex);
    if (match && match[2]) {
      jsonStrToParse = match[2].trim();
    }
    
    if (!jsonStrToParse.startsWith('{') || !jsonStrToParse.endsWith('}')) {
        const firstBrace = jsonStrToParse.indexOf('{');
        const lastBrace = jsonStrToParse.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonStrToParse = jsonStrToParse.substring(firstBrace, lastBrace + 1);
        } else if (jsonStrToParse === "") { 
             console.warn("AI response was empty after trimming and fence removal. This might indicate a safety block or no content. Raw response:", rawResponseText);
             return {
                patientName: null,
                patientDOB: null,
                surgeryDate: null,
                procedureName: null,
                doctorName: null,
                materialsUsed: []
            };
        } else {
            console.error("AI response does not appear to be a JSON object after initial cleaning. Raw response:", rawResponseText, "Attempted to parse:", jsonStrToParse);
            throw new Error("AI response is not in the expected JSON object format. It might be wrapped in text or malformed.");
        }
    }
    
    const parsedData = JSON.parse(jsonStrToParse) as ExtractedData;

    if (!parsedData || typeof parsedData !== 'object') {
        console.error("Parsed data is not an object:", parsedData, "Raw response:", rawResponseText);
        throw new Error("AI response did not parse into an object.");
    }
     if (!Array.isArray(parsedData.materialsUsed)) {
        console.warn("Parsed data.materialsUsed is not an array or is missing. Defaulting to []. Raw response:", rawResponseText);
        parsedData.materialsUsed = [];
    }
    
    parsedData.materialsUsed = parsedData.materialsUsed.map((material: MaterialUsed) => ({ 
        ...material,
        description: material.description || "Descrição Ausente",
        quantity: Number(material.quantity) || 1, 
        code: material.code === "" || material.code === undefined ? null : material.code,
        lotNumber: material.lotNumber === "" || material.lotNumber === undefined ? null : material.lotNumber,
        observation: material.observation === "" || material.observation === undefined ? null : material.observation,
    }));

    const patientInfoFields: (keyof Omit<ExtractedData, 'materialsUsed'>)[] = ['patientName', 'patientDOB', 'surgeryDate', 'procedureName', 'doctorName'];
    patientInfoFields.forEach(field => {
        if (parsedData[field] === "" || parsedData[field] === undefined) {
            (parsedData as any)[field] = null;
        }
    });

    // --- INÍCIO DA LÓGICA DE PRIORIZAÇÃO DE DATA DE CIRURGIA ---
    if (parsedData && parsedData.surgeryDate) {
      const currentYear = new Date().getFullYear().toString();
      // Se houver múltiplas datas separadas por espaço, vírgula ou barra, escolha a que contém o ano atual
      const possibleDates = parsedData.surgeryDate.split(/\s|,|\//).filter(d => d.match(/\d{4}/));
      const dateWithCurrentYear = possibleDates.find(d => d.includes(currentYear));
      if (dateWithCurrentYear) {
        parsedData.surgeryDate = dateWithCurrentYear;
      }
    }
    // --- FIM DA LÓGICA DE PRIORIZAÇÃO DE DATA DE CIRURGIA ---

    // --- INÍCIO DA LÓGICA DE NORMALIZAÇÃO DE DATA DE CIRURGIA DD/MM/AA PARA DD/MM/20AA ---
    if (parsedData && parsedData.surgeryDate) {
      // Normaliza datas no formato DD/MM/AA para DD/MM/20AA (apenas para anos 20-99)
      parsedData.surgeryDate = parsedData.surgeryDate.replace(
        /\b(\d{2})\/(\d{2})\/(\d{2})\b/g,
        (match, d, m, a) => {
          // Considera apenas anos >= 20 como 20AA
          const yearNum = parseInt(a, 10);
          if (yearNum >= 20 && yearNum <= 99) {
            return `${d}/${m}/20${a}`;
          }
          // Se não for, mantém o original
          return match;
        }
      );
    }
    // --- FIM DA LÓGICA DE NORMALIZAÇÃO DE DATA DE CIRURGIA ---

    // --- INÍCIO DA LÓGICA DE BUSCA DE DATA DE CIRURGIA NO TEXTO BRUTO ---
    if ((!parsedData.surgeryDate || parsedData.surgeryDate === null || parsedData.surgeryDate === "") && rawResponseText) {
      const match = rawResponseText.match(/\b(\d{2})\/(\d{2})\/(\d{2})\b/);
      if (match) {
        const [_, d, m, a] = match;
        const yearNum = parseInt(a, 10);
        if (yearNum >= 20 && yearNum <= 99) {
          parsedData.surgeryDate = `${d}/${m}/20${a}`;
        }
      }
    }
    // --- FIM DA LÓGICA DE BUSCA DE DATA DE CIRURGIA NO TEXTO BRUTO ---

    return parsedData;

  } catch (error) {
    const requestPromptForLogging = typeof requestPayloadContents === 'string' 
        ? requestPayloadContents 
        : (requestPayloadContents as Content).parts?.map(p => (p as {text: string}).text || "[image_part]").join("\n");

    console.error(
        "Error calling Gemini API or parsing response. Input type:", 
        isImageInput ? "Image" : "Text", 
        "Raw AI Response Text:", rawResponseText, 
        "Attempted to parse:", jsonStrToParse, 
        "Request Prompt Snippet:", requestPromptForLogging?.substring(0, 500) ?? ""
    );
    let errorMessage = "Falha ao comunicar com o serviço de IA ou processar a resposta.";
    if (error instanceof Error) {
        errorMessage += ` Detalhes: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
}
