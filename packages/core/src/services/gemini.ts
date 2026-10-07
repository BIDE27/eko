import {
  GoogleGenAI,
  Chat,
  Part,
  Content,
  GenerateContentResponse,
  Type,
  Modality,
} from "@google/genai";
import type { GeneratedQuiz, StructuredExplanation, ApiResponse, VerbConjugations } from "../types";

// Initialize the GoogleGenAI client
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  return new GoogleGenAI({ apiKey });
};
const ai = getAiClient();


/**
 * Gets a structured explanation for a quiz question from the Gemini API.
 */
export const getQuizExplanation = async (
  question: string,
  answer: string
): Promise<StructuredExplanation> => {
  const model = "gemini-3-flash-preview";

  // FIX: Replaced strict responseSchema with robust prompt engineering to ensure
  // the model can flexibly return JSON, especially with an empty 'props' object,
  // which was causing errors with the previous schema.
  const prompt = `Explique la réponse à la question suivante. Tu DOIS répondre avec un objet JSON valide et rien d'autre. N'ajoute pas de démarqueurs de code comme \`\`\`json.

Le JSON doit avoir la structure suivante :
{
  "question": "string",
  "answer": "string",
  "explanation": "string",
  "renderHints": {
    "type": "string",
    "props": {}
  }
}

Voici la question et la réponse :
Question: "${question}"
Réponse: "${answer}"

Fournis une explication claire et concise. Suggère une "renderHint" appropriée pour une aide visuelle si cela est pertinent.

**Instructions pour les renderHints :**
- **Types simples :** Utilise les types suivants pour les aides visuelles simples : "Polygon", "Triangle", "FunctionPlot", "MoleculeBohr", "SimpleDisplay".
- **Pour les diagrammes et illustrations complexes** (ex: cycle de l'eau, circuit électrique, illustrations scientifiques), utilise le type "Diagram". La prop "prompt" DOIT contenir une description textuelle détaillée de l'image à générer. Exemple : \`"renderHints": { "type": "Diagram", "props": { "prompt": "Illustration de la troisième loi de Newton montrant deux objets avec des flèches de force égales et opposées." } }\`. N'utilise PAS "Diagram" pour des figures géométriques simples (utilise "geometry").
- **Pour une image existante simple**, utilise le type "SimpleDisplay" avec \`"props": {"image": "URL_DE_L_IMAGE", "altText": "description"}\`. Tu ne dois PAS utiliser ce type pour générer une nouvelle image.
- **Pour un triangle isocèle**, le plus simple est d'utiliser : \`"renderHints": { "type": "Triangle", "props": { "type": "isosceles", "showLabels": true } }\`.
- **Figures géométriques complexes :** Pour dessiner des figures géométriques précises (points, segments, cercles), utilise le type "geometry".
  - **Exemple pour un triangle isocèle ABC :**
  \`\`\`json
  "renderHints": {
    "type": "geometry",
    "props": {
      "objects": [
        { "type": "point", "id": "A", "label": "A", "x": 0, "y": 4 },
        { "type": "point", "id": "B", "label": "B", "x": -3, "y": 0 },
        { "type": "point", "id": "C", "label": "C", "x": 3, "y": 0 },
        { "type": "segment", "points": ["A", "B"], "label": "AB" },
        { "type": "segment", "points": ["B", "C"], "label": "BC" },
        { "type": "segment", "points": ["C", "A"], "label": "AC" }
      ]
    }
  }
  \`\`\`
- Si aucune aide visuelle n'est pertinente, le type doit être "None" et props un objet vide {}.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  const text = response.text;
  
  // FIX: Add robust JSON parsing to handle potential variations in the AI's output.
  try {
    let cleanText = text.trim();
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.substring(7, cleanText.length - 3).trim();
    } else if (cleanText.startsWith("```")) {
      cleanText = cleanText.substring(3, cleanText.length - 3).trim();
    }
    const explanation = JSON.parse(cleanText) as StructuredExplanation;
    return explanation;
  } catch (error) {
    console.error("Échec de l'analyse du JSON de l'explication :", text, error);
    // Throw an error to be caught by the component
    throw new Error("Impossible d'analyser la réponse de l'IA.");
  }
};

/**
 * Creates a new Fumi chat instance.
 */
export const createFumiChat = (history: Content[]): Chat => {
  // FIX: Set up the chat with a detailed system instruction for the Fumi persona.
  const model = "gemini-3-flash-preview";
  const chat = ai.chats.create({
    model,
    history,
    config: {
      systemInstruction: `Tu es Fumi, un assistant pédagogique conversationnel. Ton but est d'aider les utilisateurs à apprendre en décomposant les problèmes en étapes claires.

Règles de réponse :
- Pour toute question ou demande d'explication, tu dois répondre en utilisant un JSON strict. N'ajoute aucun texte avant ou après le JSON.
- Le format principal est une explication étape par étape :
\`\`\`json
{
  "steps": [
    {
      "title": "Titre de l'étape 1",
      "explanation": "Explication textuelle pour cette étape.",
      "result": "Résultat ou état intermédiaire (ex: '2x = 6').",
      "renderHints": { "type": "...", "props": {} }
    },
    {
      "title": "Titre de l'étape 2",
      "explanation": "Explication pour la deuxième étape.",
      "result": "Résultat final (ex: 'x = 3')."
    }
  ]
}
\`\`\`
- Chaque étape doit avoir un 'title' et une 'explanation'. 'result' et 'renderHints' sont optionnels.
- Utilise les 'renderHints' pour demander une visualisation (graphe, schéma, etc.) à une étape précise.
  - Types possibles : "Polygon", "Triangle", "FunctionPlot", "Molecule2D", "MoleculeBohr", "BiologySVG", "RealisticImage", "SimpleDisplay", "None", "geometry", "Diagram".
  - Exemples de props :
    - Pour "Polygon", utilise \`{"nSides": 4}\`. Le nombre de côtés doit être un entier.
    - Pour "Triangle", utilise \`{"type": "isosceles"}\`. Les types valides sont 'isosceles', 'equilateral', 'right', 'scalene'.
    - Pour "SimpleDisplay", utilise \`{"mainText": "Au", "subText": "Or", "style": "chemical-symbol"}\`.
    - Pour "FunctionPlot", utilise \`{"expr": "x^2", "xRange": [-5, 5]}\`.
    - Pour "MoleculeBohr", utilise \`{"Z": 6}\`.
    - Pour les diagrammes, illustrations scientifiques ou images réalistes, utilise "Diagram" ou "RealisticImage". La prop "prompt" DOIT contenir une description textuelle détaillée de l'image à générer (ex: 'un diagramme du cycle de l'eau', 'une photo réaliste d'un lion'). N'utilise PAS "Diagram" pour des figures géométriques simples (utilise "geometry" pour ça).

Règles spéciales :
- **Génération de Quiz :** Si un utilisateur demande de créer un quiz (ex: "crée un quiz sur la biologie", "teste-moi sur l'histoire de France"), tu dois répondre **UNIQUEMENT** avec ce format JSON :
\`\`\`json
{
  "quiz": {
    "title": "Titre du Quiz",
    "questions": [
      {
        "id": 1,
        "category": "Matière",
        "question": "Texte de la question...",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "answer": "Option C",
        "difficulty": "Moyen"
      }
    ]
  }
}
\`\`\`
- **Ajout de Tâches :** Si un utilisateur souhaite ajouter des tâches à sa liste d'objectifs (ex: "ajoute 'réviser le chapitre 5' à mes objectifs"), tu dois répondre **UNIQUEMENT** avec ce JSON : \`{"action": "add_todo", "tasks": ["tâche 1", "tâche 2"], "confirmation_message": "C'est noté, je l'ai ajouté à vos objectifs."}\`.
- **Figures Géométriques:** Pour les questions de géométrie (ex: "trace un segment entre les points A(1,2) et B(4,5)"), tu dois répondre **UNIQUEMENT** avec ce format JSON :
\`\`\`json
{
  "type": "geometry",
  "objects": [
    { "type": "point", "id": "A", "label": "A", "x": 1, "y": 2 },
    { "type": "point", "id": "B", "label": "B", "x": 4, "y": 5 },
    { "type": "segment", "points": ["A", "B"], "label": "AB" }
  ]
}
\`\`\`
- Ne fournis aucune explication textuelle avec ce format. La figure est l'unique réponse.
- **Format Simple :** Pour une question très simple (ex: "Quelle est la capitale de la France ?") qui n'a pas besoin d'étapes, tu peux utiliser ce format JSON à la place :
\`\`\`json
{
  "question": "La question originale.",
  "answer": "La réponse directe.",
  "explanation": "Une explication textuelle.",
  "renderHints": { "type": "None", "props": {} }
}
\`\`\`
- **Programmation de session :** Si un utilisateur demande de programmer une session, réponds **UNIQUEMENT** avec ce JSON : \`{"action": "schedule", "details": {"title": "...", "time": "ISO_8601_DATE", "type": "learning_session" | "quiz_reminder"}, "confirmation_message": "..."}\`.
- **Salutations :** Pour de simples salutations comme "Bonjour", tu peux répondre en texte normal.

Qualité :
- Sois toujours patient, positif et encourageant.
- Les valeurs dans \`props\` doivent être des types simples (nombres, chaînes, etc.).
- Ne jamais inclure de code HTML, JavaScript ou de commentaires.`,
    },
  });
  return chat;
};

/**
 * Sends a message to an existing Fumi chat.
 */
export const sendFumiMessage = async (
  chat: Chat,
  parts: (string | Part)[]
): Promise<GenerateContentResponse> => {
  // FIX: Send the user's message parts to the chat instance.
  const response = await chat.sendMessage({ message: parts });
  return response;
};

/**
 * Generates an image from a text prompt.
 */
export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
  // FIX: Use the 'imagen-4.0-generate-001' model for image generation as per guidelines.
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: prompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio: '1:1',
    },
  });

  if (response.generatedImages && response.generatedImages.length > 0) {
    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    // FIX: Return the image as a data URL for direct use in `<img>` src.
    return `data:image/jpeg;base64,${base64ImageBytes}`;
  } else {
    throw new Error("Aucune image n'a été générée.");
  }
};

/**
 * Generates a custom quiz from a topic and other parameters.
 */
export const generateCustomQuiz = async (
  topic: string,
  numQuestions: number,
  difficulty: string,
  subject: string,
  level: string,
  studentClass: string
): Promise<GeneratedQuiz> => {
  const model = "gemini-3-flash-preview";

  const promptLines = [
    `Crée un quiz sur le sujet suivant : "${topic}".`,
    subject !== 'Toutes les matières' && `La matière du quiz est : "${subject}".`,
    level !== 'tous' && `Le quiz est destiné à un élève de niveau : "${level}".`,
    level !== 'tous' && studentClass !== 'toutes' && `Plus précisément pour la classe de : "${studentClass}".`,
    `Le quiz doit avoir exactement ${numQuestions} questions.`,
    `La difficulté des questions doit être : ${difficulty}.`,
    `Tu DOIS répondre UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après, et sans démarqueurs de code comme \`\`\`json.`,
    `Le JSON doit avoir la structure suivante :`,
    `{`,
    `  "title": "Titre du Quiz (en lien avec le sujet)",`,
    `  "questions": [`,
    `    {`,
    `      "id": 1,`,
    `      "category": "${subject}",`,
    `      "question": "Texte de la question...",`,
    `      "options": ["Option A", "Option B", "Option C", "Option D"],`,
    `      "answer": "Option C",`,
    `      "difficulty": "${difficulty}"`,
    `    }`,
    `  ]`,
    `}`
  ];

  const prompt = promptLines.filter(Boolean).join('\n');


  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  const text = response.text;
  
  try {
    let cleanText = text.trim();
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.substring(7, cleanText.length - 3).trim();
    }
    const quiz = JSON.parse(cleanText) as GeneratedQuiz;
    // The model might return a top-level `quiz` object like in Fumi chat.
    if ('quiz' in quiz) {
        return (quiz as any).quiz as GeneratedQuiz;
    }
    return quiz;
  } catch (error) {
    console.error("Échec de l'analyse du JSON du quiz généré :", text, error);
    throw new Error("Impossible d'analyser la réponse de l'IA. Elle n'a peut-être pas renvoyé un JSON valide.");
  }
};

/**
 * Gets a list of French words from the Gemini API based on a prefix.
 */
export const getWordList = async (prefix: string): Promise<string[]> => {
    const model = "gemini-3-flash-preview";
    const prompt = prefix === 'common'
      ? "Génère une liste de 50 mots français courants et variés. Réponds UNIQUEMENT avec un tableau JSON de chaînes de caractères. Exemple : [\"mot1\", \"mot2\"]"
      : `Génère une liste de 20 mots français commençant par "${prefix}". Si "${prefix}" est un mot français valide en lui-même, il DOIT être le premier élément de la liste. Réponds UNIQUEMENT avec un tableau JSON de chaînes de caractères. Exemple : ["${prefix}", "${prefix}abc", "${prefix}xyz"]`;

    const response = await ai.models.generateContent({ model, contents: prompt });
    const text = response.text;

    try {
        let cleanText = text.trim();
        if (cleanText.startsWith("```json")) {
            cleanText = cleanText.substring(7, cleanText.length - 3).trim();
        }
        
        // FIX: Add a pre-parsing step to repair common JSON syntax errors from the LLM,
        // such as missing commas between array elements on new lines.
        const repairedText = cleanText.replace(/"\s*\n\s*"/g, '",\n"');

        const wordList = JSON.parse(repairedText);
        if (Array.isArray(wordList) && wordList.every(item => typeof item === 'string')) {
            // FIX: Filter out any empty strings that the model might generate.
            return wordList.filter(word => word.trim() !== '');
        }
        throw new Error("Le format de la réponse n'est pas un tableau de chaînes de caractères.");
    } catch (error) {
        console.error("Échec de l'analyse JSON de la liste de mots :", text, error);
        throw new Error("Impossible d'analyser la liste de mots de l'IA.");
    }
};


/**
 * Gets a structured definition for a French word from the Gemini API.
 */
export const getWordDefinition = async (word: string): Promise<ApiResponse[]> => {
    const model = "gemini-3-flash-preview";
    const prompt = `Pour le mot français "${word}", fournis sa définition complète. Tu DOIS répondre UNIQUEMENT avec un objet JSON valide (un tableau contenant un seul objet), sans aucun texte avant ou après et sans démarqueurs de code comme \`\`\`json. La structure doit correspondre exactement à ceci :
[
  {
    "word": "string",
    "phonetic": "string (prononciation IPA)",
    "phonetics": [
      {
        "text": "string (prononciation IPA)",
        "audio": "string (URL de l'audio, peut être une chaîne vide si non disponible)"
      }
    ],
    "meanings": [
      {
        "partOfSpeech": "string (ex: 'nom', 'verbe')",
        "definitions": [
          {
            "definition": "string",
            "synonyms": ["string"],
            "antonyms": ["string"],
            "example": "string (phrase d'exemple)"
          }
        ],
        "synonyms": ["string"],
        "antonyms": ["string"]
      }
    ],
    "renderHints": {
      "type": "string",
      "props": {}
    }
  }
]
Assure-toi que tous les champs sont présents, même si les tableaux (comme synonyms, antonyms) sont vides [].
Dans la phrase d'exemple ("example"), mets le mot concerné en gras en utilisant la syntaxe markdown (**mot**).

**Instructions pour les renderHints :**
- Pour un mot représentant un objet concret (ex: "maison", "arbre", "chien"), utilise le type "RealisticImage" avec une "props" contenant un "prompt" pour la génération d'image. Exemple : \`"renderHints": { "type": "RealisticImage", "props": { "prompt": "Une photo réaliste d'une maison de campagne avec un jardin fleuri." } }\`.
- Pour un verbe d'action (ex: "courir", "sauter"), utilise "RealisticImage" avec un prompt décrivant l'action. Exemple : \`"renderHints": { "type": "RealisticImage", "props": { "prompt": "Photo d'un athlète en train de courir sur une piste." } }\`.
- Pour un concept abstrait (ex: "amour", "temps"), utilise le type "Diagram" avec une "props" contenant un "prompt" pour une illustration symbolique. Exemple : \`"renderHints": { "type": "Diagram", "props": { "prompt": "Une illustration stylisée représentant un cœur lumineux et des liens connectant des personnes." } }\`.
- Si aucune illustration n'est pertinente ou possible, utilise le type "None" avec des props vides : \`"renderHints": { "type": "None", "props": {} }\`.`;
    
    const response = await ai.models.generateContent({ model, contents: prompt });
    const text = response.text;

    try {
        let cleanText = text.trim();
        if (cleanText.startsWith("```json")) {
            cleanText = cleanText.substring(7, cleanText.length - 3).trim();
        }
        const definition = JSON.parse(cleanText) as ApiResponse[];
        return definition;
    } catch (error) {
        console.error("Échec de l'analyse JSON de la définition du mot :", text, error);
        throw new Error("Impossible d'analyser la définition du mot de l'IA.");
    }
};

/**
 * Gets a structured English definition for a French word from the Gemini API.
 */
export const getEnglishDefinition = async (word: string): Promise<ApiResponse[]> => {
    const model = "gemini-3-flash-preview";
    const prompt = `Pour le mot français "${word}", fournis sa traduction principale en anglais et des explications en FRANÇAIS. Tu DOIS répondre UNIQUEMENT avec un objet JSON valide (un tableau contenant un seul objet), sans aucun texte avant ou après et sans démarqueurs de code. La structure doit être :
[
  {
    "word": "le mot français original",
    "translation": "The primary English translation of the French word",
    "phonetic": "prononciation IPA du mot français",
    "phonetics": [],
    "meanings": [
      {
        "partOfSpeech": "La nature grammaticale en FRANÇAIS (ex: 'Nom', 'Verbe')",
        "definitions": [
          {
            "definition": "Définition en FRANÇAIS du mot anglais traduit",
            "synonyms": ["English synonyms for the translated word"],
            "antonyms": ["English antonyms for the translated word"],
            "examples": [
              {
                "en": "An English example sentence using the **translated** word.",
                "fr": "Une phrase d'exemple en français utilisant le **mot** traduit."
              },
              {
                "en": "Another example with the **word** in a different context.",
                "fr": "Un autre exemple avec le **mot** dans un contexte différent."
              }
            ]
          }
        ],
        "synonyms": [],
        "antonyms": []
      }
    ],
    "renderHints": {
      "type": "RealisticImage",
      "props": { "prompt": "An English prompt for an image representing the word." }
    }
  }
]
Règles importantes :
- Assure-toi que tous les champs sont présents, même si les tableaux sont vides.
- Fournis au moins deux exemples pertinents ("examples") pour illustrer différents contextes d'utilisation du mot.
- Dans chaque phrase d'exemple (champs "en" et "fr"), mets le mot concerné en gras en utilisant la syntaxe markdown (**mot**).
- Pour 'renderHints', si aucune image n'est pertinente, utilise '{"type": "None", "props": {}}'. Le prompt pour l'image doit être en ANGLAIS.`;
    
    const response = await ai.models.generateContent({ model, contents: prompt });
    const text = response.text;

    try {
        let cleanText = text.trim();
        if (cleanText.startsWith("```json")) {
            cleanText = cleanText.substring(7, cleanText.length - 3).trim();
        }
        const definition = JSON.parse(cleanText) as ApiResponse[];
        return definition;
    } catch (error) {
        console.error("Échec de l'analyse JSON de la définition anglaise :", text, error);
        throw new Error("Impossible d'analyser la définition anglaise de l'IA.");
    }
};


/**
 * Generates speech from text using the Gemini TTS model.
 * @param text The text to convert to speech.
 * @param lang The language of the text.
 * @returns A base64 encoded audio string.
 */
export const generateSpeechFromText = async (text: string, lang: 'fr' | 'en' = 'fr', slow: boolean = false, readPunctuation: boolean = false): Promise<string> => {
  const model = "gemini-2.5-flash-preview-tts";
  const langName = lang === 'fr' ? 'français' : 'anglais';

  // Add a contextual prefix to make requests more robust, especially for single words.
  // The model is instructed to pronounce the text that follows.
  const speedInstruction = slow ? " lentement, en articulant bien chaque syllabe," : "";
  const punctuationInstruction = readPunctuation ? " en prononçant explicitement les signes de ponctuation (virgule, point, point d'interrogation, etc.)," : "";
  const prompt = `Prononce${speedInstruction}${punctuationInstruction} le texte ${langName} suivant : ${text}`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          // 'Kore' is a good general French voice. The model is smart enough to switch to English if prompted.
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("Aucune donnée audio n'a été reçue de l'API.");
  }

  return base64Audio;
};

/**
 * Translates text from a source language to a target language.
 * @param text The text to translate.
 * @param sourceLang The source language code ('fr' or 'en').
 * @param targetLang The target language code ('fr' or 'en').
 * @returns The translated text.
 */
export const translateText = async (
  text: string,
  sourceLang: 'fr' | 'en',
  targetLang: 'fr' | 'en'
): Promise<string> => {
  const model = "gemini-3-flash-preview";
  const sourceLangName = sourceLang === 'fr' ? 'français' : 'anglais';
  const targetLangName = targetLang === 'fr' ? 'français' : 'anglais';

  const prompt = `Traduis le texte suivant du ${sourceLangName} vers le ${targetLangName}. Réponds UNIQUEMENT avec le texte traduit, sans aucune explication, préambule ou formatage supplémentaire.

Texte à traduire : "${text}"`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text.trim();
};

/**
 * Gets a batch of alphabetically sorted French words from the Gemini API.
 * @param startAfterWord The word after which the new list should start.
 * @param count The number of words to fetch.
 */
export const getAlphabeticalWordBatch = async (startAfterWord?: string, count: number = 50): Promise<string[]> => {
    const model = "gemini-3-flash-preview";
    const prompt = startAfterWord
      ? `Génère une liste de ${count} mots français courants par ordre alphabétique, commençant juste après le mot "${startAfterWord}". Assure-toi que les mots sont uniques et ne dupliquent pas les mots précédents. Réponds UNIQUEMENT avec un tableau JSON de chaînes de caractères. Exemple : ["mot1", "mot2"]`
      : `Génère une liste des ${count} premiers mots français courants par ordre alphabétique (commençant par 'a'). Réponds UNIQUEMENT avec un tableau JSON de chaînes de caractères. Exemple : ["à", "abandonner", ...]`;

    const response = await ai.models.generateContent({ model, contents: prompt });
    const text = response.text;

    try {
        let cleanText = text.trim();
        if (cleanText.startsWith("```json")) {
            cleanText = cleanText.substring(7, cleanText.length - 3).trim();
        }
        const repairedText = cleanText.replace(/"\s*\n\s*"/g, '",\n"');
        const wordList = JSON.parse(repairedText);
        if (Array.isArray(wordList) && wordList.every(item => typeof item === 'string')) {
            return wordList.filter(word => word.trim() !== '');
        }
        throw new Error("Le format de la réponse n'est pas un tableau de chaînes de caractères.");
    } catch (error) {
        console.error("Échec de l'analyse JSON de la liste de mots alphabétique :", text, error);
        throw new Error("Impossible d'analyser la liste de mots de l'IA.");
    }
};

/**
 * Gets the complete conjugation for a French verb using the Gemini API.
 * @param verb The verb to conjugate (can be infinitive or any conjugated form).
 * @returns A structured object with all conjugations.
 */
export const getVerbConjugation = async (verb: string): Promise<VerbConjugations> => {
  const model = "gemini-3-flash-preview";
  const prompt = `Tu es un expert en grammaire française spécialisé dans la conjugaison des verbes. Ta tâche est de fournir la conjugaison complète pour un verbe français donné, en séparant le radical de la terminaison et en fournissant une phrase d'exemple.

L'utilisateur fournira un verbe, qui pourrait être sous sa forme infinitive ou une forme conjuguée. Ton premier objectif est d'identifier l'infinitif correct. Sois indulgent avec les fautes de frappe courantes. Par exemple, si l'utilisateur tape "boir", tu dois reconnaître qu'il s'agit probablement de "boire". Si l'utilisateur tape "je suis", tu dois identifier l'infinitif "être".

Si l'entrée, même après avoir tenté une correction orthographique, ne correspond à aucun verbe français valide, tu DOIS répondre UNIQUEMENT avec l'objet JSON suivant :
{
  "error": "Le verbe '${verb}' n'a pas été trouvé ou n'est pas un verbe valide."
}

Si le verbe est valide, tu DOIS répondre UNIQUEMENT avec un objet JSON valide représentant sa conjugaison complète. N'inclus aucun texte avant ou après le JSON, et n'utilise pas de blocs de code markdown comme \`\`\`json.

Au niveau racine de l'objet JSON, tu dois également inclure deux clés supplémentaires : "group" (une chaîne de caractères décrivant le groupe du verbe, ex: 'Verbe du 1er groupe') et "definition" (une courte définition de l'infinitif).

Pour chaque temps et chaque personne, fournis un objet JSON avec trois clés : "stem" (le radical), "ending" (la terminaison), et "example" (une phrase d'exemple simple utilisant cette forme).

La structure JSON doit être la suivante :
{
  "group": "Verbe du 1er groupe",
  "definition": "Consommer un aliment.",
  "Infinitif": { "Présent": { "stem": "mang", "ending": "er", "example": "Il faut manger pour vivre." }, "Passé": { "stem": "avoir mang", "ending": "é", "example": "Après avoir mangé, il est parti." } },
  "Participe": { "Présent": { "stem": "mange", "ending": "ant", "example": "En mangeant, il lisait." }, "Passé": { "stem": "mang", "ending": "é", "example": "Le gâteau mangé était délicieux." } },
  "Indicatif": {
    "Présent": { "je": { "stem": "mang", "ending": "e", "example": "Je mange une pomme." }, "tu": { "stem": "mang", "ending": "es", "example": "Tu manges des légumes." }, "il/elle/on": { "stem": "mang", "ending": "e", "example": "Il mange du riz." }, "nous": { "stem": "mange", "ending": "ons", "example": "Nous mangeons ensemble." }, "vous": { "stem": "mang", "ending": "ez", "example": "Vous mangez tard." }, "ils/elles": { "stem": "mang", "ending": "ent", "example": "Elles mangent au restaurant." } },
    "Passé composé": { "je": { "stem": "ai mang", "ending": "é", "example": "J'ai mangé une pomme." }, "tu": { "stem": "as mang", "ending": "é", "example": "Tu as mangé des légumes." }, "il/elle/on": { "stem": "a mang", "ending": "é", "example": "Il a mangé du riz." }, "nous": { "stem": "avons mang", "ending": "é", "example": "Nous avons mangé ensemble." }, "vous": { "stem": "avez mang", "ending": "é", "example": "Vous avez mangé tard." }, "ils/elles": { "stem": "ont mang", "ending": "é", "example": "Elles ont mangé au restaurant." } },
    "Imparfait": { "je": { "stem": "mange", "ending": "ais", "example": "Je mangeais une pomme." }, "tu": { "stem": "mange", "ending": "ais", "example": "Tu mangeais des légumes." }, "il/elle/on": { "stem": "mange", "ending": "ait", "example": "Il mangeait du riz." }, "nous": { "stem": "mang", "ending": "ions", "example": "Nous mangions ensemble." }, "vous": { "stem": "mang", "ending": "iez", "example": "Vous mangiez tard." }, "ils/elles": { "stem": "mange", "ending": "aient", "example": "Elles mangeaient au restaurant." } },
    "Plus-que-parfait": { "je": { "stem": "avais mang", "ending": "é", "example": "J'avais mangé une pomme." }, "tu": { "stem": "avais mang", "ending": "é", "example": "Tu avais mangé des légumes." }, "il/elle/on": { "stem": "avait mang", "ending": "é", "example": "Il avait mangé du riz." }, "nous": { "stem": "avions mang", "ending": "é", "example": "Nous avions mangé ensemble." }, "vous": { "stem": "aviez mang", "ending": "é", "example": "Vous aviez mangé tard." }, "ils/elles": { "stem": "avaient mang", "ending": "é", "example": "Elles avaient mangé au restaurant." } },
    "Passé simple": { "je": { "stem": "mange", "ending": "ai", "example": "Je mangeai une pomme." }, "tu": { "stem": "mange", "ending": "as", "example": "Tu mangeas des légumes." }, "il/elle/on": { "stem": "mange", "ending": "a", "example": "Il mangea du riz." }, "nous": { "stem": "mange", "ending": "âmes", "example": "Nous mangeâmes ensemble." }, "vous": { "stem": "mange", "ending": "âtes", "example": "Vous mangeâtes tard." }, "ils/elles": { "stem": "mang", "ending": "èrent", "example": "Elles mangèrent au restaurant." } },
    "Passé antérieur": { "je": { "stem": "eus mang", "ending": "é", "example": "Dès que j'eus mangé, je sortis." }, "tu": { "stem": "eus mang", "ending": "é", "example": "Dès que tu eus mangé, tu sortis." }, "il/elle/on": { "stem": "eut mang", "ending": "é", "example": "Dès qu'il eut mangé, il sortit." }, "nous": { "stem": "eûmes mang", "ending": "é", "example": "Dès que nous eûmes mangé, nous sortîmes." }, "vous": { "stem": "eûtes mang", "ending": "é", "example": "Dès que vous eûtes mangé, vous sortîtes." }, "ils/elles": { "stem": "eurent mang", "ending": "é", "example": "Dès qu'elles eurent mangé, elles sortirent." } },
    "Futur simple": { "je": { "stem": "manger", "ending": "ai", "example": "Je mangerai une pomme." }, "tu": { "stem": "manger", "ending": "as", "example": "Tu mangeras des légumes." }, "il/elle/on": { "stem": "manger", "ending": "a", "example": "Il mangera du riz." }, "nous": { "stem": "manger", "ending": "ons", "example": "Nous mangerons ensemble." }, "vous": { "stem": "manger", "ending": "ez", "example": "Vous mangerez tard." }, "ils/elles": { "stem": "manger", "ending": "ont", "example": "Elles mangeront au restaurant." } },
    "Futur antérieur": { "je": { "stem": "aurai mang", "ending": "é", "example": "J'aurai mangé avant ton retour." }, "tu": { "stem": "auras mang", "ending": "é", "example": "Tu auras mangé avant mon retour." }, "il/elle/on": { "stem": "aura mang", "ending": "é", "example": "Il aura mangé avant ton retour." }, "nous": { "stem": "aurons mang", "ending": "é", "example": "Nous aurons mangé avant ton retour." }, "vous": { "stem": "aurez mang", "ending": "é", "example": "Vous aurez mangé avant ton retour." }, "ils/elles": { "stem": "auront mang", "ending": "é", "example": "Elles auront mangé avant ton retour." } }
  },
  "Subjonctif": {
    "Présent": { "je": { "stem": "mang", "ending": "e", "example": "Il faut que je mange." }, "tu": { "stem": "mang", "ending": "es", "example": "Il faut que tu manges." }, "il/elle/on": { "stem": "mang", "ending": "e", "example": "Il faut qu'il mange." }, "nous": { "stem": "mang", "ending": "ions", "example": "Il faut que nous mangions." }, "vous": { "stem": "mang", "ending": "iez", "example": "Il faut que vous mangiez." }, "ils/elles": { "stem": "mang", "ending": "ent", "example": "Il faut qu'elles mangent." } },
    "Passé": { "je": { "stem": "aie mang", "ending": "é", "example": "Je doute que j'aie mangé." }, "tu": { "stem": "aies mang", "ending": "é", "example": "Je doute que tu aies mangé." }, "il/elle/on": { "stem": "ait mang", "ending": "é", "example": "Je doute qu'il ait mangé." }, "nous": { "stem": "ayons mang", "ending": "é", "example": "Je doute que nous ayons mangé." }, "vous": { "stem": "ayez mang", "ending": "é", "example": "Je doute que vous ayez mangé." }, "ils/elles": { "stem": "aient mang", "ending": "é", "example": "Je doute qu'elles aient mangé." } },
    "Imparfait": { "je": { "stem": "mange", "ending": "asse", "example": "Il fallait que je mangeasse." }, "tu": { "stem": "mange", "ending": "asses", "example": "Il fallait que tu mangeasses." }, "il/elle/on": { "stem": "mange", "ending": "ât", "example": "Il fallait qu'il mangeât." }, "nous": { "stem": "mange", "ending": "assions", "example": "Il fallait que nous mangeassions." }, "vous": { "stem": "mange", "ending": "assiez", "example": "Il fallait que vous mangeassiez." }, "ils/elles": { "stem": "mange", "ending": "assent", "example": "Il fallait qu'elles mangeassent." } },
    "Plus-que-parfait": { "je": { "stem": "eusse mang", "ending": "é", "example": "J'aurais voulu que j'eusse mangé." }, "tu": { "stem": "eusses mang", "ending": "é", "example": "J'aurais voulu que tu eusses mangé." }, "il/elle/on": { "stem": "eût mang", "ending": "é", "example": "J'aurais voulu qu'il eût mangé." }, "nous": { "stem": "eussions mang", "ending": "é", "example": "J'aurais voulu que nous eussions mangé." }, "vous": { "stem": "eussiez mang", "ending": "é", "example": "J'aurais voulu que vous eussiez mangé." }, "ils/elles": { "stem": "eussent mang", "ending": "é", "example": "J'aurais voulu qu'elles eussent mangé." } }
  },
  "Conditionnel": {
    "Présent": { "je": { "stem": "manger", "ending": "ais", "example": "Je mangerais bien une pomme." }, "tu": { "stem": "manger", "ending": "ais", "example": "Tu mangerais bien une pomme." }, "il/elle/on": { "stem": "manger", "ending": "ait", "example": "Il mangerait bien une pomme." }, "nous": { "stem": "manger", "ending": "ions", "example": "Nous mangerions bien une pomme." }, "vous": { "stem": "manger", "ending": "iez", "example": "Vous mangeriez bien une pomme." }, "ils/elles": { "stem": "manger", "ending": "aient", "example": "Elles mangeraient bien une pomme." } },
    "Passé": { "je": { "stem": "aurais mang", "ending": "é", "example": "J'aurais mangé si j'avais eu faim." }, "tu": { "stem": "aurais mang", "ending": "é", "example": "Tu aurais mangé si tu avais eu faim." }, "il/elle/on": { "stem": "aurait mang", "ending": "é", "example": "Il aurait mangé s'il avait eu faim." }, "nous": { "stem": "aurions mang", "ending": "é", "example": "Nous aurions mangé si nous avions eu faim." }, "vous": { "stem": "auriez mang", "ending": "é", "example": "Vous auriez mangé si vous aviez eu faim." }, "ils/elles": { "stem": "auraient mang", "ending": "é", "example": "Elles auraient mangé si elles avaient eu faim." } }
  },
  "Impératif": {
    "Présent": { "je": "-", "tu": { "stem": "mang", "ending": "e", "example": "Mange ta soupe !" }, "il/elle/on": "-", "nous": { "stem": "mange", "ending": "ons", "example": "Mangeons maintenant." }, "vous": { "stem": "mang", "ending": "ez", "example": "Mangez des fruits." }, "ils/elles": "-" },
    "Passé": { "je": "-", "tu": { "stem": "aie mang", "ending": "é", "example": "Aie mangé avant mon retour." }, "il/elle/on": "-", "nous": { "stem": "ayons mang", "ending": "é", "example": "Ayons mangé avant de partir." }, "vous": { "stem": "ayez mang", "ending": "é", "example": "Ayez mangé avant midi." }, "ils/elles": "-" }
  }
}

Règles importantes pour le contenu JSON :
- Pour les temps composés, le "stem" doit inclure l'auxiliaire conjugué suivi du radical du participe passé. L'"ending" est la terminaison du participe passé. Exemple pour "j'ai mangé": { "stem": "ai mang", "ending": "é", "example": "..." }.
- L'exemple doit être une phrase complète et simple.
- Pour l'Impératif, utilise un tiret "-" pour les personnes qui n'ont pas de conjugaison.
- Fournis TOUS les modes et TOUS les temps listés ci-dessus.
- Ne pas inclure "que" pour le Subjonctif.
- Ne pas gérer l'élision du pronom (j', l', etc.) dans la réponse. Fournis simplement le verbe décomposé. Le pronom sera ajouté par l'interface.

Maintenant, identifie l'infinitif, fournis son groupe et sa définition, et conjugue le verbe suivant : "${verb}"`;

  const response = await ai.models.generateContent({ model, contents: prompt });
  const text = response.text;

  try {
    let cleanText = text.trim();
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.substring(7, cleanText.length - 3).trim();
    }
    const conjugationData = JSON.parse(cleanText);

    if (conjugationData.error) {
      throw new Error(conjugationData.error);
    }

    if (!conjugationData.Indicatif || !conjugationData.Indicatif.Présent) {
      throw new Error("La réponse de l'IA n'a pas le format de conjugaison attendu.");
    }
    
    return conjugationData as VerbConjugations;

  } catch (error) {
    console.error("Échec de l'analyse JSON de la conjugaison :", text, error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("Impossible d'analyser la réponse de l'IA.");
  }
};

/**
 * Gets a list of suggested verbs if the user input is not a valid verb.
 * @param incorrectWord The word the user typed that was not found.
 * @returns A promise that resolves to an array of string suggestions.
 */
export const getVerbSuggestions = async (incorrectWord: string): Promise<string[]> => {
  const model = "gemini-3-flash-preview";
  const prompt = `Pour le mot incorrect "${incorrectWord}", qui n'est probably pas un verbe français valide, suggère une liste de 5 verbes français qui pourraient être des corrections orthographiques ou des verbes phonétiquement similaires. Réponds UNIQUEMENT avec un tableau JSON de chaînes de caractères. Si aucune suggestion n'est pertinente, retourne un tableau vide [].

Exemples:
- Pour "par", tu pourrais suggérer : ["parler", "partir", "paraître"]
- Pour "mangee", tu pourrais suggérer : ["manger"]

Maintenant, fournis des suggestions pour : "${incorrectWord}"`;

  const response = await ai.models.generateContent({ model, contents: prompt });
  const text = response.text;

  try {
    let cleanText = text.trim();
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.substring(7, cleanText.length - 3).trim();
    }
    const suggestions = JSON.parse(cleanText);
    if (Array.isArray(suggestions) && suggestions.every(item => typeof item === 'string')) {
      return suggestions;
    }
    return []; // Return empty array if format is incorrect
  } catch (error) {
    console.error("Échec de l'analyse JSON des suggestions de verbes :", text, error);
    return []; // Return empty array on failure
  }
};

/**
 * Gets an explanation and more examples for a given sentence.
 * @param sentence The sentence to explain.
 * @returns A promise that resolves to an object with explanation and examples.
 */
export const getSentenceExplanation = async (sentence: string): Promise<{ explanation: string; examples: string[] }> => {
  const model = "gemini-3-flash-preview";
  const prompt = `Pour la phrase française suivante : "${sentence}"

1.  Explique sa signification de manière simple et claire, comme si tu t'adressais à un apprenant de la langue. L'explication doit être entièrement en français. N'inclus AUCUNE traduction en anglais ou dans une autre langue.
2.  Fournis 3 à 5 exemples de phrases supplémentaires qui utilisent le verbe de la même manière (même temps, même contexte si possible) pour illustrer son usage.

Tu DOIS répondre UNIQUEMENT avec un objet JSON valide, sans démarqueurs de code. La structure doit être :
{
  "explanation": "Ton explication de la phrase ici, EN FRANÇAIS SEULEMENT.",
  "examples": [
    "Premier exemple de phrase.",
    "Deuxième exemple de phrase.",
    "Troisième exemple de phrase."
  ]
}`;

  const response = await ai.models.generateContent({ model, contents: prompt });
  const text = response.text;

  try {
      let cleanText = text.trim();
      if (cleanText.startsWith("```json")) {
          cleanText = cleanText.substring(7, cleanText.length - 3).trim();
      }
      const data = JSON.parse(cleanText);
      return data;
  } catch (error) {
      console.error("Échec de l'analyse JSON de l'explication de la phrase :", text, error);
      throw new Error("Impossible d'analyser la réponse de l'IA.");
  }
};

/**
 * Gets an explanation for French verb groups from Gemini.
 * @param group The specific group to highlight.
 * @returns A promise that resolves to a string with the explanation.
 */
export const getVerbGroupExplanation = async (group: string): Promise<string> => {
  const model = "gemini-3-flash-preview";
  const prompt = `Explique comment identifier les groupes de verbes en français (1er, 2ème, 3ème).

**Règles strictes de réponse :**
1.  **PAS D'INTRODUCTION.** Commence directement par l'explication. Ne dis pas "Bonjour", "Aujourd'hui nous allons voir", etc.
2.  **PRIORITÉ AU GROUPE DEMANDÉ.** Commence OBLIGATOIREMENT par l'explication détaillée du groupe suivant : "${group}".
3.  **EXPLIQUE LES AUTRES ENSUITE.** Après avoir expliqué le groupe demandé, fournis des explications plus brèves pour les deux autres groupes.
4.  **FORMAT.** Pour chaque groupe, tu dois :
    - Donner un titre clair (ex: "LE PREMIER GROUPE DE VERBES").
    - Expliquer la règle de terminaison de l'infinitif.
    - Donner des exemples.
    - Mentionner les exceptions ou particularités importantes (ex: le verbe "aller" pour le 1er groupe).
5.  **STYLE.** Utilise un langage simple et clair. Utilise du texte brut avec des sauts de ligne pour la lisibilité. N'utilise PAS de JSON ou de Markdown.`;

  const response = await ai.models.generateContent({ model, contents: prompt });
  return response.text.trim();
};
