import { NextResponse } from 'next/server';
import { getDatabase, mapResource, mapDataset } from '@/lib/research/db';

interface SearchRequest {
  query: string;
}

interface SearchContext {
  resources: Array<{
    id: string;
    title: string;
    authors: string[];
    abstract: string;
    keywords: string[];
    topic: string;
    state: string | null;
    district: string | null;
    dataStatus: string;
    sourceUrl: string | null;
  }>;
  datasets: Array<{
    id: string;
    name: string;
    provider: string;
    type: string;
    geographicScope: string;
    temporalScope: string | null;
    variables: string[];
    dataStatus: string;
    sourceUrl: string | null;
  }>;
}

interface SearchResponse {
  answer: string;
  resources: Array<{
    id: string;
    title: string;
    authors: string[];
    topic: string;
    state: string | null;
    district: string | null;
    dataStatus: string;
    sourceUrl: string | null;
  }>;
  datasets: Array<{
    id: string;
    name: string;
    provider: string;
    type: string;
    geographicScope: string;
    dataStatus: string;
    sourceUrl: string | null;
  }>;
  sourceIds: string[];
  provenance: Record<string, string>;
  evidenceSufficient: boolean;
}

const SYSTEM_PROMPT = `You are a research assistant for a land governance and urban expansion research portal.
Answer ONLY from the supplied context (ResearchResource and Dataset records).
Rules:
- Never invent sources, authors, statistics, URLs, or citations.
- Clearly say when evidence is insufficient.
- Preserve SAMPLE/REAL/DERIVED dataStatus exactly as provided.
- Never present SAMPLE data as real evidence.
- Cite source IDs from the context.
- Be concise and factual.`;

function extractKeywords(query: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'among', 'is', 'are',
    'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
    'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can',
    'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we',
    'they', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why',
    'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
    'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
    'just', 'now', 'then', 'here', 'there', 'how', 'is', 'are', 'how', 'is',
    'affecting', 'affect', 'effect', 'effects', 'impact', 'impacts'
  ]);

  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

async function retrieveResources(keywords: string[]): Promise<SearchContext['resources']> {
  if (keywords.length === 0) return [];

  const db = getDatabase();
  const clauses: string[] = [];
  const args: any[] = [];
  for (const kw of keywords) {
    const like = `%${kw.toLowerCase()}%`;
    clauses.push(
      '(LOWER(title) LIKE ? OR LOWER(abstract) LIKE ? OR LOWER(keywords) LIKE ? OR LOWER(topic) LIKE ? OR LOWER(state) LIKE ? OR LOWER(district) LIKE ?)'
    );
    args.push(like, like, like, like, like, like);
  }

  const rows = db
    .prepare(
      `SELECT * FROM research_resources WHERE ${clauses.join(' OR ')} ORDER BY created_at DESC LIMIT 10`
    )
    .all(...args) as any[];

  return rows.map(mapResource).map((r) => ({
    id: r!.id,
    title: r!.title,
    authors: r!.authors,
    abstract: r!.abstract,
    keywords: r!.keywords,
    topic: r!.topic,
    state: r!.state,
    district: r!.district,
    dataStatus: r!.dataStatus,
    sourceUrl: r!.sourceUrl,
  }));
}

async function retrieveDatasets(keywords: string[]): Promise<SearchContext['datasets']> {
  if (keywords.length === 0) return [];

  const db = getDatabase();
  const clauses: string[] = [];
  const args: any[] = [];
  for (const kw of keywords) {
    const like = `%${kw.toLowerCase()}%`;
    clauses.push(
      '(LOWER(name) LIKE ? OR LOWER(provider) LIKE ? OR LOWER(type) LIKE ? OR LOWER(geographic_scope) LIKE ? OR LOWER(variables) LIKE ?)'
    );
    args.push(like, like, like, like, like);
  }

  const rows = db
    .prepare(`SELECT * FROM datasets WHERE ${clauses.join(' OR ')} ORDER BY created_at DESC LIMIT 10`)
    .all(...args) as any[];

  return rows.map(mapDataset).map((d) => ({
    id: d!.id,
    name: d!.name,
    provider: d!.provider,
    type: d!.type,
    geographicScope: d!.geographicScope,
    temporalScope: d!.temporalScope,
    variables: d!.variables,
    dataStatus: d!.dataStatus,
    sourceUrl: d!.sourceUrl,
  }));
}

function buildContext(context: SearchContext): string {
  const parts: string[] = [];

  if (context.resources.length > 0) {
    parts.push('=== RESEARCH RESOURCES ===');
    context.resources.forEach((r) => {
      parts.push(`[Resource ID: ${r.id}]`);
      parts.push(`Title: ${r.title}`);
      parts.push(`Authors: ${r.authors.join(', ')}`);
      parts.push(`Topic: ${r.topic}`);
      if (r.state) parts.push(`State: ${r.state}`);
      if (r.district) parts.push(`District: ${r.district}`);
      parts.push(`Data Status: ${r.dataStatus}`);
      parts.push(`Abstract: ${r.abstract}`);
      parts.push(`Keywords: ${r.keywords.join(', ')}`);
      if (r.sourceUrl) parts.push(`Source URL: ${r.sourceUrl}`);
      parts.push('');
    });
  }

  if (context.datasets.length > 0) {
    parts.push('=== DATASETS ===');
    context.datasets.forEach((d) => {
      parts.push(`[Dataset ID: ${d.id}]`);
      parts.push(`Name: ${d.name}`);
      parts.push(`Provider: ${d.provider}`);
      parts.push(`Type: ${d.type}`);
      parts.push(`Geographic Scope: ${d.geographicScope}`);
      if (d.temporalScope) parts.push(`Temporal Scope: ${d.temporalScope}`);
      parts.push(`Data Status: ${d.dataStatus}`);
      parts.push(`Variables: ${d.variables.join(', ')}`);
      if (d.sourceUrl) parts.push(`Source URL: ${d.sourceUrl}`);
      parts.push('');
    });
  }

  if (parts.length === 0) {
    parts.push('No relevant records found in the database.');
  }

  return parts.join('\n');
}

async function callAIProvider(context: string, query: string): Promise<{ answer: string; evidenceSufficient: boolean }> {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    return {
      answer: 'AI provider not configured. Please set GROQ_API_KEY environment variable.',
      evidenceSufficient: false,
    };
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Context:\n${context}\n\nQuestion: ${query}\n\nProvide a structured answer with:\n1. Direct answer based only on context\n2. Whether evidence is sufficient (true/false)\n\nFormat as JSON: {"answer": "...", "evidenceSufficient": true/false}` },
        ],
        temperature: 0.1,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI provider error:', response.status, errorText);
      return {
        answer: 'AI service temporarily unavailable. Please try again later.',
        evidenceSufficient: false,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      return {
        answer: 'No response from AI provider.',
        evidenceSufficient: false,
      };
    }

    try {
      const parsed = JSON.parse(content);
      return {
        answer: parsed.answer || 'No answer generated.',
        evidenceSufficient: parsed.evidenceSufficient === true,
      };
    } catch {
      return {
        answer: content,
        evidenceSufficient: content.length > 50,
      };
    }
  } catch (error) {
    console.error('AI provider call failed:', error);
    return {
      answer: 'AI service temporarily unavailable. Please try again later.',
      evidenceSufficient: false,
    };
  }
}

export async function POST(request: Request) {
  try {
    const body: SearchRequest = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (query.length > 500) {
      return NextResponse.json(
        { error: 'Query too long (max 500 characters)' },
        { status: 400 }
      );
    }

    const keywords = extractKeywords(query);

    const [resources, datasets] = await Promise.all([
      retrieveResources(keywords),
      retrieveDatasets(keywords),
    ]);

    const context: SearchContext = { resources, datasets };
    const contextText = buildContext(context);

    const { answer, evidenceSufficient } = await callAIProvider(contextText, query);

    const allSourceIds = [
      ...resources.map((r) => r.id),
      ...datasets.map((d) => d.id),
    ];

    const provenance: Record<string, string> = {};
    resources.forEach((r) => { provenance[r.id] = r.dataStatus; });
    datasets.forEach((d) => { provenance[d.id] = d.dataStatus; });

    const response: SearchResponse = {
      answer,
      resources: resources.map((r) => ({
        id: r.id,
        title: r.title,
        authors: r.authors,
        topic: r.topic,
        state: r.state,
        district: r.district,
        dataStatus: r.dataStatus,
        sourceUrl: r.sourceUrl,
      })),
      datasets: datasets.map((d) => ({
        id: d.id,
        name: d.name,
        provider: d.provider,
        type: d.type,
        geographicScope: d.geographicScope,
        dataStatus: d.dataStatus,
        sourceUrl: d.sourceUrl,
      })),
      sourceIds: allSourceIds,
      provenance,
      evidenceSufficient,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('AI search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}