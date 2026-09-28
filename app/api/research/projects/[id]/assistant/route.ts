import { NextResponse } from 'next/server';
import {
  getDatabase,
  mapProject,
  mapQuestion,
  mapResource,
  mapDataset,
  mapGisLayer,
  mapAnalysis,
  mapFinding,
} from '@/lib/research/db';
import { authorizeProjectRead } from '@/lib/research/project-auth';

interface AssistantRequest {
  query: string;
}

interface ProjectContext {
  project: {
    id: string;
    title: string;
    researchProblem: string;
    objectives: string[];
    geographicScope: string;
    institution: string;
    status: string;
  };
  questions: Array<{ id: string; question: string; description: string | null }>;
  resources: Array<{
    id: string;
    title: string;
    authors: string[];
    organization: string | null;
    resourceType: string;
    publicationYear: number | null;
    topic: string;
    state: string | null;
    district: string | null;
    keywords: string[];
    abstract: string;
    source: string;
    sourceUrl: string | null;
    accessLevel: string;
    verificationStatus: boolean;
    dataStatus: string;
  }>;
  datasets: Array<{
    id: string;
    name: string;
    provider: string;
    type: string;
    geographicScope: string;
    temporalScope: string | null;
    variables: string[];
    format: string;
    spatialResolution: string | null;
    crs: string | null;
    licenseAccess: string;
    sourceUrl: string | null;
    updateFrequency: string | null;
    version: string;
    qualityStatus: string;
    dataStatus: string;
  }>;
  gisLayers: Array<{
    id: string;
    name: string;
    category: string;
    description: string | null;
    provider: string | null;
    sourceUrl: string | null;
    geoserverUrl: string | null;
    geometryType: string;
    state: string | null;
    district: string | null;
    dataStatus: string;
  }>;
  analyses: Array<{
    id: string;
    title: string;
    methodology: string;
    resultsSummary: string;
    dataStatus: string;
    question: { id: string; question: string; description: string | null } | null;
  }>;
  findings: Array<{
    id: string;
    statement: string;
    confidence: string;
    dataStatus: string;
    analysisId: string | null;
    analysis: { id: string; title: string } | null;
  }>;
}

interface AssistantResponse {
  answer: string;
  sourceIds: string[];
  resources: Array<{ id: string; title: string; dataStatus: string; sourceUrl: string | null }>;
  datasets: Array<{ id: string; name: string; dataStatus: string; sourceUrl: string | null }>;
  analyses: Array<{ id: string; title: string; dataStatus: string }>;
  findings: Array<{ id: string; statement: string; dataStatus: string }>;
  provenance: Record<string, string>;
  evidenceSufficient: boolean;
}

const SYSTEM_PROMPT = `You are a Research Assistant for a specific land governance and urban expansion research project.
Answer ONLY from the supplied project context (project details, questions, resources, datasets, GIS layers, analyses, findings).
Rules:
- Never invent sources, statistics, URLs, or citations.
- Clearly say when evidence is insufficient.
- Preserve SAMPLE/REAL/DERIVED dataStatus exactly as provided.
- Never present SAMPLE data as real-world evidence.
- Cite source IDs from the context.
- Be concise and factual.
- You are assisting with THIS project only, not general knowledge.`;

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
    'just', 'now', 'then', 'here', 'there', 'project', 'research', 'study',
  ]);

  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

async function retrieveProjectContext(projectId: string): Promise<ProjectContext> {
  const db = getDatabase();
  const projectRow = db.prepare('SELECT * FROM research_projects WHERE id = ?').get(projectId) as any;

  if (!projectRow) {
    throw new Error('Project not found');
  }

  const project = mapProject(projectRow)!;

  const questionRows = db.prepare('SELECT * FROM research_questions WHERE project_id = ?').all(projectId) as any[];
  const questions = questionRows.map(mapQuestion);

  const resourceLinkRows = db.prepare('SELECT * FROM project_resources WHERE project_id = ?').all(projectId) as any[];
  const resources = resourceLinkRows
    .map((pr) => mapResource(db.prepare('SELECT * FROM research_resources WHERE id = ?').get(pr.resource_id)))
    .filter(Boolean);

  const datasetLinkRows = db.prepare('SELECT * FROM project_datasets WHERE project_id = ?').all(projectId) as any[];
  const datasets = datasetLinkRows
    .map((pd) => mapDataset(db.prepare('SELECT * FROM datasets WHERE id = ?').get(pd.dataset_id)))
    .filter(Boolean);

  const gisLinkRows = db.prepare('SELECT * FROM project_gis_layers WHERE project_id = ?').all(projectId) as any[];
  const gisLayers = gisLinkRows
    .map((gl) => mapGisLayer(db.prepare('SELECT * FROM gis_layers WHERE id = ?').get(gl.layer_id)))
    .filter(Boolean);

  const analysisRows = db.prepare('SELECT * FROM analyses WHERE project_id = ?').all(projectId) as any[];
  const analyses = analysisRows.map((a) => {
    const questionRow = a.question_id
      ? (db.prepare('SELECT * FROM research_questions WHERE id = ?').get(a.question_id) as any)
      : null;
    const mapped = mapAnalysis(a)!;
    return {
      id: mapped.id,
      title: mapped.title,
      methodology: mapped.methodology,
      resultsSummary: mapped.resultsSummary,
      dataStatus: mapped.dataStatus,
      question: questionRow
        ? { id: questionRow.id, question: questionRow.question, description: questionRow.description }
        : null,
    };
  });

  const findingRows = db.prepare('SELECT * FROM findings WHERE project_id = ?').all(projectId) as any[];
  const findings = findingRows.map((f) => {
    const analysisRow = f.analysis_id
      ? (db.prepare('SELECT * FROM analyses WHERE id = ?').get(f.analysis_id) as any)
      : null;
    const mapped = mapFinding(f)!;
    return {
      id: mapped.id,
      statement: mapped.statement,
      confidence: mapped.confidence,
      dataStatus: mapped.dataStatus,
      analysisId: mapped.analysisId,
      analysis: analysisRow ? { id: analysisRow.id, title: analysisRow.title } : null,
    };
  });

  return {
    project: {
      id: project.id,
      title: project.title,
      researchProblem: project.researchProblem,
      objectives: project.objectives,
      geographicScope: project.geographicScope,
      institution: project.institution,
      status: project.status,
    },
    questions: questions.map((q: any) => ({ id: q.id, question: q.question, description: q.description })),
    resources: resources as any,
    datasets: datasets as any,
    gisLayers: gisLayers as any,
    analyses,
    findings,
  };
}

function buildContext(context: ProjectContext): string {
  const parts: string[] = [];

  // Project overview
  parts.push('=== PROJECT ===');
  parts.push(`Project ID: ${context.project.id}`);
  parts.push(`Title: ${context.project.title}`);
  parts.push(`Research Problem: ${context.project.researchProblem}`);
  parts.push(`Objectives: ${context.project.objectives.join('; ')}`);
  parts.push(`Geographic Scope: ${context.project.geographicScope}`);
  parts.push(`Institution: ${context.project.institution}`);
  parts.push(`Status: ${context.project.status}`);
  parts.push('');

  // Questions
  if (context.questions.length > 0) {
    parts.push('=== RESEARCH QUESTIONS ===');
    context.questions.forEach((q) => {
      parts.push(`[Question ID: ${q.id}]`);
      parts.push(`Question: ${q.question}`);
      if (q.description) parts.push(`Description: ${q.description}`);
      parts.push('');
    });
  }

  // Resources
  if (context.resources.length > 0) {
    parts.push('=== RESEARCH RESOURCES ===');
    context.resources.forEach((r) => {
      parts.push(`[Resource ID: ${r.id}]`);
      parts.push(`Title: ${r.title}`);
      parts.push(`Authors: ${r.authors.join(', ')}`);
      parts.push(`Type: ${r.resourceType}`);
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

  // Datasets
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
      parts.push(`Quality Status: ${d.qualityStatus}`);
      parts.push(`Variables: ${d.variables.join(', ')}`);
      if (d.sourceUrl) parts.push(`Source URL: ${d.sourceUrl}`);
      parts.push('');
    });
  }

  // GIS Layers
  if (context.gisLayers.length > 0) {
    parts.push('=== GIS LAYERS ===');
    context.gisLayers.forEach((l) => {
      parts.push(`[GIS Layer ID: ${l.id}]`);
      parts.push(`Name: ${l.name}`);
      parts.push(`Category: ${l.category}`);
      if (l.description) parts.push(`Description: ${l.description}`);
      if (l.provider) parts.push(`Provider: ${l.provider}`);
      parts.push(`Geometry Type: ${l.geometryType}`);
      if (l.state) parts.push(`State: ${l.state}`);
      if (l.district) parts.push(`District: ${l.district}`);
      parts.push(`Data Status: ${l.dataStatus}`);
      if (l.sourceUrl) parts.push(`Source URL: ${l.sourceUrl}`);
      parts.push('');
    });
  }

  // Analyses
  if (context.analyses.length > 0) {
    parts.push('=== ANALYSES ===');
    context.analyses.forEach((a) => {
      parts.push(`[Analysis ID: ${a.id}]`);
      parts.push(`Title: ${a.title}`);
      parts.push(`Methodology: ${a.methodology}`);
      parts.push(`Results Summary: ${a.resultsSummary}`);
      parts.push(`Data Status: ${a.dataStatus}`);
      if (a.question) {
        parts.push(`Linked Question: ${a.question.question}`);
      }
      parts.push('');
    });
  }

  // Findings
  if (context.findings.length > 0) {
    parts.push('=== FINDINGS ===');
    context.findings.forEach((f) => {
      parts.push(`[Finding ID: ${f.id}]`);
      parts.push(`Statement: ${f.statement}`);
      parts.push(`Confidence: ${f.confidence}`);
      parts.push(`Data Status: ${f.dataStatus}`);
      if (f.analysis) {
        parts.push(`From Analysis: ${f.analysis.title}`);
      }
      parts.push('');
    });
  }

  if (parts.length === 1) {
    parts.push('No project data available.');
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
          { role: 'user', content: `Project Context:\n${context}\n\nQuestion: ${query}\n\nProvide a structured answer with:\n1. Direct answer based only on project context\n2. Whether evidence is sufficient (true/false)\n\nFormat as JSON: {"answer": "...", "evidenceSufficient": true/false}` },
        ],
        temperature: 0.1,
        max_tokens: 1000,
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

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Check project access
    const access = await authorizeProjectRead(id);
    if (access.response) return access.response;

    const body: AssistantRequest = await request.json();
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

    // Retrieve project-specific context
    const projectContext = await retrieveProjectContext(id);

    // Build context text for LLM
    const contextText = buildContext(projectContext);

    // Call AI provider
    const { answer, evidenceSufficient } = await callAIProvider(contextText, query);

    // Collect all source IDs and provenance
    const allSourceIds: string[] = [];
    const provenance: Record<string, string> = {};

    projectContext.resources.forEach((r) => {
      allSourceIds.push(r.id);
      provenance[r.id] = r.dataStatus;
    });
    projectContext.datasets.forEach((d) => {
      allSourceIds.push(d.id);
      provenance[d.id] = d.dataStatus;
    });
    projectContext.gisLayers.forEach((l) => {
      allSourceIds.push(l.id);
      provenance[l.id] = l.dataStatus;
    });
    projectContext.analyses.forEach((a) => {
      allSourceIds.push(a.id);
      provenance[a.id] = a.dataStatus;
    });
    projectContext.findings.forEach((f) => {
      allSourceIds.push(f.id);
      provenance[f.id] = f.dataStatus;
    });
    projectContext.questions.forEach((q) => {
      allSourceIds.push(q.id);
      provenance[q.id] = 'N/A';
    });

    const response: AssistantResponse = {
      answer,
      sourceIds: allSourceIds,
      resources: projectContext.resources.map((r) => ({
        id: r.id,
        title: r.title,
        dataStatus: r.dataStatus,
        sourceUrl: r.sourceUrl,
      })),
      datasets: projectContext.datasets.map((d) => ({
        id: d.id,
        name: d.name,
        dataStatus: d.dataStatus,
        sourceUrl: d.sourceUrl,
      })),
      analyses: projectContext.analyses.map((a) => ({
        id: a.id,
        title: a.title,
        dataStatus: a.dataStatus,
      })),
      findings: projectContext.findings.map((f) => ({
        id: f.id,
        statement: f.statement,
        dataStatus: f.dataStatus,
      })),
      provenance,
      evidenceSufficient,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error('Project assistant error:', error);
    if (error.message === 'Project not found') {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}