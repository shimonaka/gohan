import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

type SceneConfig = {
  model: string;
  temperature?: number;
  maxTokens?: number;
  system_prompt?: string | ((variables: Record<string, unknown>) => string);
};

const SCENE_NAME = 'fridge_image_analyzer';
const AI_BASE_URL = 'https://api.youware.com/public/v1/ai';
const AI_API_KEY = 'sk-YOUWARE';

const detectionSchema = z.object({
  ingredients: z
    .array(
      z.object({
        name: z
          .string()
          .min(1, 'Ingredient name must not be empty')
          .max(64, 'Ingredient name is too long'),
      })
    )
    .max(50, 'Too many ingredients returned'),
});

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('API Error - Failed to read image file'));
      }
    };
    reader.onerror = () => reject(new Error('API Error - Failed to read image file'));
    reader.readAsDataURL(file);
  });

const normalizeDetectedNames = (names: string[]): string[] => {
  const unique = new Set<string>();
  names.forEach((name) => {
    const normalized = name.trim();
    if (normalized.length > 0) {
      unique.add(normalized);
    }
  });
  return Array.from(unique).slice(0, 50);
};

export async function analyzeFridgeImage(file: File): Promise<string[]> {
  const config = (
    globalThis as typeof globalThis & {
      ywConfig?: {
        ai_config?: Record<string, SceneConfig>;
      };
    }
  )?.ywConfig?.ai_config?.[SCENE_NAME];

  if (!config) {
    console.error('❌ API Error - Configuration not found:', { scene: SCENE_NAME });
    throw new Error(`API Error - Configuration '${SCENE_NAME}' not found`);
  }

  const startTime = Date.now();
  const dataUrl = await fileToBase64(file);
  const imagePayload = dataUrl.startsWith('data:') ? dataUrl : `data:${file.type || 'image/jpeg'};base64,${dataUrl}`;

  console.log('🚀 Starting fridge image analysis:', {
    scene: SCENE_NAME,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  });

  console.log('🤖 AI API Request:', {
    model: config.model,
    scene: SCENE_NAME,
    temperature: config.temperature ?? 0.2,
    maxTokens: config.maxTokens ?? 4000,
  });

  const openai = createOpenAI({
    baseURL: AI_BASE_URL,
    apiKey: AI_API_KEY,
  });

  try {
    const systemPrompt =
      typeof config.system_prompt === 'function'
        ? config.system_prompt({})
        : config.system_prompt ?? '';

    const result = await generateObject({
      model: openai(config.model),
      messages: [
        ...(systemPrompt
          ? [
              {
                role: 'system' as const,
                content: systemPrompt,
              },
            ]
          : []),
        {
          role: 'user',
          content: [
            {
              type: 'image' as const,
              image: imagePayload,
            },
            {
              type: 'text' as const,
              text: 'Identify distinct ingredient names that are clearly visible in this refrigerator photo. Return concise Japanese names only.',
            },
          ],
        },
      ],
      schema: detectionSchema,
      temperature: config.temperature ?? 0.2,
      maxTokens: config.maxTokens ?? 4000,
    });

    const detected = normalizeDetectedNames(result.object.ingredients.map((entry) => entry.name));

    console.log('✅ AI API Response:', {
      model: config.model,
      scene: SCENE_NAME,
      detectedCount: detected.length,
      processingTime: `${Date.now() - startTime}ms`,
    });

    return detected;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ API Error - Fridge image analysis failed:', {
      model: config.model,
      scene: SCENE_NAME,
      error: message,
      processingTime: `${Date.now() - startTime}ms`,
    });
    throw new Error(`API Error - Fridge image analysis failed: ${message}`);
  }
}
