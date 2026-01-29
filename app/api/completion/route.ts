// ============================================
// LLM Completion API - 支援多供應商
// ============================================

import type { LLMProvider } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const { provider, model, prompt, maxTokens = 500 } = (await req.json()) as {
      provider: LLMProvider;
      model?: string;
      prompt: string;
      maxTokens?: number;
    };

    let response: Response;
    let content: string;

    switch (provider) {
      case 'claude':
        ({ response, content } = await callClaude(prompt, model, maxTokens));
        break;
      case 'openai':
        ({ response, content } = await callOpenAI(prompt, model, maxTokens));
        break;
      case 'groq':
        ({ response, content } = await callGroq(prompt, model, maxTokens));
        break;
      default:
        // 向後兼容：預設使用 Gemini
        ({ response, content } = await callGemini(prompt, maxTokens));
    }

    if (!response.ok) {
      return Response.json(
        { error: `API Error: ${response.status}` },
        { status: response.status }
      );
    }

    return Response.json({ content });
  } catch (error: any) {
    console.error('Completion API Error:', error);
    return Response.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// ============ Claude (Anthropic) ============

async function callClaude(
  prompt: string,
  model: string = 'claude-sonnet-4-20250514',
  maxTokens: number
): Promise<{ response: Response; content: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Missing ANTHROPIC_API_KEY environment variable');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Claude API Error:', errorText);
    return { response, content: '' };
  }

  const data = await response.json() as {
    content?: Array<{ text?: string }>;
  };
  const content = data.content?.[0]?.text || '';

  return { response, content };
}

// ============ OpenAI ============

async function callOpenAI(
  prompt: string,
  model: string = 'gpt-4o-mini',
  maxTokens: number
): Promise<{ response: Response; content: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API Error:', errorText);
    return { response, content: '' };
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content || '';

  return { response, content };
}

// ============ Groq ============

async function callGroq(
  prompt: string,
  model: string = 'llama-3.1-70b-versatile',
  maxTokens: number
): Promise<{ response: Response; content: string }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GROQ_API_KEY environment variable');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Groq API Error:', errorText);
    return { response, content: '' };
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content || '';

  return { response, content };
}

// ============ Gemini (向後兼容) ============

async function callGemini(
  prompt: string,
  maxTokens: number
): Promise<{ response: Response; content: string }> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable');
  }

  const MODEL_NAME = 'gemini-flash-lite-latest';
  const url = `https://gateway.ai.cloudflare.com/v1/b4ca0337fb21e846c53e1f2611ba436c/gateway04/google-ai-studio/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
          role: 'user',
        },
      ],
      generationConfig: {
        maxOutputTokens: maxTokens,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API Error:', errorText);
    return { response, content: '' };
  }

  const data = await response.json() as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };
  const content =
    data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  return { response, content };
}
