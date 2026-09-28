import { randomUUID } from 'crypto';
import { getDatabase, initDb, nowIso } from '../lib/db';

function main() {
  console.log('Starting database seeding (SAMPLE / DEMO data)...');

  initDb();
  const db = getDatabase();

  // Clear tables in FK-safe order
  const clearOrder = [
    'saved_resources',
    'innovation_submissions',
    'innovation_opportunities',
    'research_outputs',
    'findings',
    'analyses',
    'project_gis_layers',
    'project_datasets',
    'project_resources',
    'research_questions',
    'project_members',
    'research_projects',
    'gis_layers',
    'datasets',
    'research_resources',
    'research_profiles',
    'users',
  ];
  const clearAll = db.transaction(() => {
    for (const table of clearOrder) {
      db.prepare(`DELETE FROM ${table}`).run();
    }
  });
  clearAll();

  const now = nowIso();

  // ---------- Users & Profiles ----------
  const user1Id = randomUUID();
  const user2Id = randomUUID();

  db.prepare(
    `INSERT INTO users (id, email, name, platform_role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(user1Id, 'dr.sharma@academic.edu', 'Dr. Rajesh Sharma', 'RESEARCH_ACADEMIC', now, now);
  db.prepare(
    `INSERT INTO research_profiles (id, user_id, academic_type, institution, department, designation, research_interests, expertise, bio, verification_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    randomUUID(),
    user1Id,
    'FACULTY',
    'Indian Institute of Technology (IIT) - Demo Campus',
    'Department of Regional Planning',
    'Professor & Senior Researcher',
    JSON.stringify(['Urban Expansion', 'Agricultural Land Conversion', 'GIS Mapping', 'Land Governance']),
    JSON.stringify(['Spatial Analysis', 'Land Policy', 'Remote Sensing']),
    'Leading research initiatives on agricultural land preservation and urban sprawl modeling.',
    1
  );

  db.prepare(
    `INSERT INTO users (id, email, name, platform_role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(user2Id, 'priya.student@academic.edu', 'Priya Verma', 'RESEARCH_ACADEMIC', now, now);
  db.prepare(
    `INSERT INTO research_profiles (id, user_id, academic_type, institution, department, designation, research_interests, expertise, bio, verification_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    randomUUID(),
    user2Id,
    'RESEARCH_SCHOLAR',
    'National University of Policy Studies',
    'School of Public Policy',
    'Doctoral Candidate',
    JSON.stringify(['Agricultural Economics', 'District Land Records', 'Urban Sprawl']),
    JSON.stringify(['GIS', 'Quantitative Analysis']),
    'Ph.D. scholar researching socio-economic impacts of urban peripheral growth.',
    1
  );

  // ---------- Research Resources ----------
  const resource1Id = randomUUID();
  const resource2Id = randomUUID();

  db.prepare(
    `INSERT INTO research_resources
      (id, title, authors, organization, resource_type, publication_year, topic, state, district, language, keywords, abstract, source, source_url, access_level, verification_status, data_status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    resource1Id,
    'Urban Expansion and Agricultural Land Conversion in Tamil Nadu: A 10-Year Spatial Analysis',
    JSON.stringify(['Dr. Rajesh Sharma', 'Priya Verma']),
    'Center for Land Governance Studies',
    'Research Paper',
    2022,
    'Urban Sprawl & Agriculture',
    'Tamil Nadu',
    'District X',
    'English',
    JSON.stringify(['Urban Expansion', 'Agricultural Land', 'Tamil Nadu', 'GIS Analysis']),
    'This sample research paper examines the rapid conversion of paddy and agricultural lands into residential and industrial layouts in peri-urban districts of Tamil Nadu between 2012 and 2022 using sample remote sensing indices.',
    'Sample Academic Repository',
    'https://example.org/sample-paper-tamil-nadu-urban-expansion',
    'Open Access',
    1,
    'SAMPLE',
    now
  );

  db.prepare(
    `INSERT INTO research_resources
      (id, title, authors, organization, resource_type, publication_year, topic, state, district, language, keywords, abstract, source, source_url, access_level, verification_status, data_status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    resource2Id,
    'Policy Frameworks for Peri-Urban Land Protection in India',
    JSON.stringify(['Ananya Sen', 'Karthik Rao']),
    'Institute of National Policy',
    'Government Policy Report',
    2021,
    'Land Governance & Policy',
    'All India',
    null,
    'English',
    JSON.stringify(['Policy', 'Land Protection', 'Peri-urban', 'Zoning']),
    'An analytical review of existing state-level legislative instruments and zoning policies aimed at safeguarding fertile agricultural tracts from unplanned urban encroachment.',
    'Sample Policy Archives',
    'https://example.org/sample-policy-report',
    'Open Access',
    1,
    'SAMPLE',
    now
  );

  // ---------- Datasets ----------
  const dataset1Id = randomUUID();
  const dataset2Id = randomUUID();

  db.prepare(
    `INSERT INTO datasets
      (id, name, provider, type, geographic_scope, temporal_scope, variables, format, spatial_resolution, crs, license_access, source_url, update_frequency, version, quality_status, data_status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    dataset1Id,
    'District X Land Use and Land Cover (LULC) Sample Grid 2023',
    'Sample Remote Sensing Agency',
    'Satellite/Remote Sensing',
    'District X, Tamil Nadu',
    '2023',
    JSON.stringify(['Land Cover Class', 'Normalized Difference Vegetation Index (NDVI)', 'Built-up Area Ratio']),
    'GeoTIFF / Vector Shapefile',
    '30m',
    'EPSG:4326',
    'Open Research License (Sample)',
    'https://example.org/datasets/district-x-lulc-sample',
    'Annual',
    '2.1',
    'VERIFIED',
    'SAMPLE',
    now
  );

  db.prepare(
    `INSERT INTO datasets
      (id, name, provider, type, geographic_scope, temporal_scope, variables, format, spatial_resolution, crs, license_access, source_url, update_frequency, version, quality_status, data_status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    dataset2Id,
    'Socioeconomic and Agricultural Yield Sample Statistics - District X',
    'Sample Bureau of Economics',
    'Socioeconomic',
    'District X, Tamil Nadu',
    '2015-2022',
    JSON.stringify(['Crop Yield (Tonnes/Hectare)', 'Average Land Holding Size', 'Conversion Rate']),
    'CSV / JSON',
    'Taluk level',
    'N/A',
    'Restricted Academic (Sample)',
    'https://example.org/datasets/socioeconomic-sample',
    'Biennial',
    '1.0',
    'PARTIALLY_VERIFIED',
    'SAMPLE',
    now
  );

  // ---------- GIS Layers ----------
  const gisLayer1Id = randomUUID();
  const gisLayer2Id = randomUUID();
  const gisLayer3Id = randomUUID();

  db.prepare(
    `INSERT INTO gis_layers (id, name, category, description, provider, source_url, geoserver_url, geometry_type, state, district, data_status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    gisLayer1Id,
    'District X Administrative Boundaries & Taluks',
    'administrative',
    'Sample boundary polygons for administrative taluks and village clusters in District X.',
    'Sample Cartography Dept',
    'https://example.org/gis/district-x-boundaries',
    'https://geoserver.example.org/wms/district-x',
    'Polygon',
    'Tamil Nadu',
    'District X',
    'SAMPLE',
    now
  );

  db.prepare(
    `INSERT INTO gis_layers (id, name, category, description, provider, source_url, geoserver_url, geometry_type, state, district, data_status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    gisLayer2Id,
    'Decadal Built-up Expansion Overlay (2010-2020)',
    'land_use',
    'Sample raster/vector overlay tracking built-up expansion vectors over agricultural zones.',
    'Sample Remote Sensing Lab',
    'https://example.org/gis/built-up-expansion',
    'https://geoserver.example.org/wms/expansion',
    'Polygon',
    'Tamil Nadu',
    'District X',
    'SAMPLE',
    now
  );

  db.prepare(
    `INSERT INTO gis_layers (id, name, category, description, provider, source_url, geoserver_url, geometry_type, state, district, data_status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    gisLayer3Id,
    'Sample GeoJSON Boundary Demo',
    'administrative',
    'DEMO ONLY: Sample layer with local GeoJSON source for verifying map rendering. NOT real government data.',
    'Sample Cartography Dept',
    '/api/geojson/sample',
    null,
    'Polygon',
    'Tamil Nadu',
    'District X',
    'SAMPLE',
    now
  );

  // ---------- Research Project ----------
  const projectId = randomUUID();
  db.prepare(
    `INSERT INTO research_projects
      (id, title, research_problem, objectives, geographic_scope, start_date, end_date, institution, status, visibility, owner_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    projectId,
    'Impact of Urban Expansion on Agricultural Land in District X',
    'How is rapid urban expansion affecting fertile agricultural land conversion in District X, and what policy interventions can mitigate unplanned loss?',
    JSON.stringify([
      'Quantify total agricultural land converted to non-agricultural uses between 2015 and 2023.',
      'Identify spatial hotspots of urban sprawl using satellite LULC data.',
      'Evaluate effectiveness of existing zoning regulations.',
    ]),
    'District X, Tamil Nadu',
    new Date('2024-01-15').toISOString(),
    new Date('2024-12-31').toISOString(),
    'Indian Institute of Technology (IIT) - Demo Campus',
    'ACTIVE',
    'Public',
    user1Id,
    now,
    now
  );

  db.prepare(
    `INSERT INTO project_members (id, project_id, user_id, role, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(randomUUID(), projectId, user1Id, 'OWNER', now);
  db.prepare(
    `INSERT INTO project_members (id, project_id, user_id, role, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(randomUUID(), projectId, user2Id, 'EDITOR', now);

  const question1Id = randomUUID();
  const question2Id = randomUUID();
  db.prepare(
    `INSERT INTO research_questions (id, project_id, question, description, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(
    question1Id,
    projectId,
    'Which taluks in District X experienced the highest percentage of agricultural land conversion?',
    'Analyzing spatial distribution of LULC changes across taluk boundaries.',
    now
  );
  db.prepare(
    `INSERT INTO research_questions (id, project_id, question, description, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(
    question2Id,
    projectId,
    'What is the correlation between transport corridor expansion and land use change?',
    'Examining proximity to national highways versus conversion rates.',
    now
  );

  db.prepare(`INSERT INTO project_resources (id, project_id, resource_id, created_at) VALUES (?, ?, ?, ?)`).run(
    randomUUID(),
    projectId,
    resource1Id,
    now
  );
  db.prepare(`INSERT INTO project_resources (id, project_id, resource_id, created_at) VALUES (?, ?, ?, ?)`).run(
    randomUUID(),
    projectId,
    resource2Id,
    now
  );

  db.prepare(`INSERT INTO project_datasets (id, project_id, dataset_id, created_at) VALUES (?, ?, ?, ?)`).run(
    randomUUID(),
    projectId,
    dataset1Id,
    now
  );
  db.prepare(`INSERT INTO project_datasets (id, project_id, dataset_id, created_at) VALUES (?, ?, ?, ?)`).run(
    randomUUID(),
    projectId,
    dataset2Id,
    now
  );

  db.prepare(`INSERT INTO project_gis_layers (id, project_id, layer_id, created_at) VALUES (?, ?, ?, ?)`).run(
    randomUUID(),
    projectId,
    gisLayer1Id,
    now
  );
  db.prepare(`INSERT INTO project_gis_layers (id, project_id, layer_id, created_at) VALUES (?, ?, ?, ?)`).run(
    randomUUID(),
    projectId,
    gisLayer2Id,
    now
  );
  db.prepare(`INSERT INTO project_gis_layers (id, project_id, layer_id, created_at) VALUES (?, ?, ?, ?)`).run(
    randomUUID(),
    projectId,
    gisLayer3Id,
    now
  );

  // ---------- Analysis & Findings ----------
  const analysisId = randomUUID();
  db.prepare(
    `INSERT INTO analyses (id, project_id, question_id, title, methodology, results_summary, data_status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    analysisId,
    projectId,
    null,
    'Spatial Superimposition of LULC 2015 vs 2023',
    'Vector overlay analysis comparing classified satellite imagery bands for urban footprint expansion against agricultural baseline masks.',
    'Approximately 14.5% of fertile single-crop agricultural land within 10km of municipal boundaries converted to commercial/residential use.',
    'SAMPLE',
    now
  );

  db.prepare(
    `INSERT INTO findings (id, project_id, analysis_id, statement, confidence, data_status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    randomUUID(),
    projectId,
    analysisId,
    'Urban expansion in District X is concentrated along the northern transport corridor, resulting in a 14.5% net loss of agricultural land over 8 years.',
    'High',
    'SAMPLE',
    now
  );

  // ---------- Research Outputs ----------
  const insertOutput = db.prepare(
    `INSERT INTO research_outputs
      (id, project_id, title, type, author_id, abstract, keywords, methodology, data_sources, version, review_status, data_status, visibility, publication_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  insertOutput.run(
    randomUUID(),
    projectId,
    'Policy Brief: Mitigating Agricultural Land Loss in Peri-Urban District X',
    'policy_brief',
    user1Id,
    'This policy brief outlines actionable recommendations for district planning authorities to protect high-yield agricultural corridors from ad-hoc commercial conversion.',
    JSON.stringify(['Policy Brief', 'District X', 'Agriculture', 'Urban Planning']),
    'Mixed-method spatial GIS overlay combined with secondary policy literature review.',
    JSON.stringify(['District X Land Use Sample Grid 2023', 'Sample Policy Archives']),
    '1.0',
    'PUBLISHED',
    'SAMPLE',
    'Public',
    new Date('2024-03-01').toISOString(),
    now,
    now
  );

  insertOutput.run(
    randomUUID(),
    projectId,
    'Decadal Land Use Change Analysis Report',
    'Report',
    user1Id,
    'Comprehensive analysis of land use changes across District X over the past decade, using sample remote sensing data.',
    JSON.stringify(['Land Use', 'Remote Sensing', 'District X', 'Change Detection']),
    'Satellite image classification with sample NDVI indices and supervised machine learning on sample training data.',
    JSON.stringify(['District X LULC Sample Grid 2023', 'Sample Meteorological Records']),
    '1.0',
    'UNDER_REVIEW',
    'SAMPLE',
    'Public',
    null,
    now,
    now
  );

  insertOutput.run(
    randomUUID(),
    projectId,
    'Case Study: Agricultural Land Conversion Patterns',
    'Case Study',
    user2Id,
    'Case study examining agricultural land conversion patterns in peri-urban areas of District X using sample socio-economic data.',
    JSON.stringify(['Case Study', 'Agriculture', 'Conversion', 'District X']),
    'Mixed-method analysis combining sample satellite imagery with sample socio-economic survey data.',
    JSON.stringify(['Sample Socioeconomic Statistics', 'District X Boundary Data']),
    '1.0',
    'DRAFT',
    'SAMPLE',
    'Internal',
    null,
    now,
    now
  );

  insertOutput.run(
    randomUUID(),
    projectId,
    'Model/Pilot: Sprawl Prediction Framework',
    'Model/Pilot',
    user1Id,
    'Pilot model for predicting urban sprawl patterns based on sample historical expansion vectors.',
    JSON.stringify(['Model', 'Prediction', 'Sprawl', 'Urban Expansion']),
    'Sample logistic regression on historical expansion data with sample validation metrics.',
    JSON.stringify(['Decadal Built-up Expansion Overlay', 'Sample District X Demographics']),
    '0.9',
    'DRAFT',
    'SAMPLE',
    'Restricted',
    null,
    now,
    now
  );

  // ---------- Innovation Opportunities ----------
  const insertOpportunity = db.prepare(
    `INSERT INTO innovation_opportunities (id, title, type, organizer, description, deadline, eligibility, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  insertOpportunity.run(
    randomUUID(),
    'Smart Sprawl Prediction Challenge',
    'hackathon',
    'National Land Governance Innovation Lab (Demo)',
    'DEMO ONLY: A sample hackathon challenging participants to build predictive models for urban expansion patterns using sample remote sensing data and sample socio-economic indicators.',
    new Date('2026-12-15').toISOString(),
    'Open to university students, research scholars, and academic faculty across India.',
    'OPEN',
    now
  );

  insertOpportunity.run(
    randomUUID(),
    'GIS Innovation Pilot: District X',
    'Pilot Project',
    'Sample Geospatial Research Foundation (Demo)',
    'DEMO ONLY: A sample pilot project for testing innovative GIS-based land monitoring approaches using sample spatial datasets.',
    new Date('2027-03-31').toISOString(),
    'Open to research teams and academic institutions with demonstrated GIS expertise.',
    'OPEN',
    now
  );

  insertOpportunity.run(
    randomUUID(),
    'Land Policy Innovation Case Study Competition',
    'Case Study Competition',
    'Sample Policy Innovation Institute (Demo)',
    'DEMO ONLY: A sample case study competition inviting researchers to develop sample policy recommendations for sustainable land management in peri-urban regions.',
    new Date('2027-01-31').toISOString(),
    'Open to academic researchers and policy professionals.',
    'UNDER_REVIEW',
    now
  );

  const opportunityWithSubmissionId = randomUUID();
  insertOpportunity.run(
    opportunityWithSubmissionId,
    'National Land Governance Hackathon 2026 - Smart Sprawl Challenge',
    'hackathon',
    'Ministry of Rural & Land Development (Demo)',
    'Call for innovative digital tools, automated LULC change detection models, and policy prototypes to assist districts in sustainable land monitoring.',
    new Date('2026-11-30').toISOString(),
    'Open to university students, research scholars, and academic faculty across India.',
    'OPEN',
    now
  );

  db.prepare(
    `INSERT INTO innovation_submissions (id, opportunity_id, user_id, project_id, title, abstract, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    randomUUID(),
    opportunityWithSubmissionId,
    user2Id,
    projectId,
    'Automated Peri-Urban Sprawl Alert System',
    'A prototype dashboard utilizing sample satellite raster feeds to flag rapid unauthorized conversion of agricultural plots in real-time.',
    'SUBMITTED',
    now
  );

  console.log('Seeding completed successfully with SAMPLE data!');
}

main();
