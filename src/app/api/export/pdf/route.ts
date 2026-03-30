// ============================================
// InsightGov Africa - API Export PDF
// Génération de rapports PDF
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseJsonField } from '@/lib/parsers';

// ============================================
// POST /api/export/pdf - Générer un PDF
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { datasetId, organizationId, title, includeCharts = true } = body;

    if (!datasetId) {
      return NextResponse.json(
        { success: false, error: 'datasetId requis' },
        { status: 400 }
      );
    }

    // Récupérer les données du dataset
    const dataset = await db.dataset.findUnique({
      where: { id: datasetId },
      include: {
        organization: true,
        kpiConfigs: {
          where: { isPublished: true },
          take: 10,
        },
      },
    });

    if (!dataset) {
      return NextResponse.json(
        { success: false, error: 'Dataset non trouvé' },
        { status: 404 }
      );
    }

    // Générer le contenu HTML du rapport
    const htmlContent = generateReportHtml(dataset, title);

    // Retourner le HTML (dans une vraie implémentation, on utiliserait @react-pdf/renderer)
    return NextResponse.json({
      success: true,
      data: {
        htmlContent,
        datasetName: dataset.name,
        rowCount: dataset.rowCount,
        columnCount: dataset.columnCount,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Erreur POST export/pdf:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la génération' },
      { status: 500 }
    );
  }
}

// ============================================
// Fonction de génération du HTML du rapport
// ============================================

function generateReportHtml(
  dataset: {
    id: string;
    name: string;
    rowCount: number;
    columnCount: number;
    columnsMetadata: string;
    organization?: { name: string } | null;
    kpiConfigs: Array<{ configJson: string }>;
  },
  title?: string
): string {
  const columnsMetadata = parseJsonField(dataset.columnsMetadata, []);
  const generatedAt = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Parse KPI configs
  const kpis = dataset.kpiConfigs.map((kpi) => {
    const config = parseJsonField(kpi.configJson, {});
    return config;
  });

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || dataset.name} - InsightGov Africa</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #fff;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 20mm;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #059669;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 24px;
      color: #059669;
      margin-bottom: 10px;
    }
    .header .org-name {
      font-size: 18px;
      color: #6b7280;
    }
    .header .generated-at {
      font-size: 12px;
      color: #9ca3af;
      margin-top: 10px;
    }
    .summary {
      background: #f0fdf4;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .summary h2 {
      font-size: 16px;
      color: #059669;
      margin-bottom: 15px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
    }
    .summary-item {
      text-align: center;
    }
    .summary-item .value {
      font-size: 24px;
      font-weight: bold;
      color: #1f2937;
    }
    .summary-item .label {
      font-size: 12px;
      color: #6b7280;
    }
    .columns-section {
      margin-bottom: 30px;
    }
    .columns-section h2 {
      font-size: 16px;
      color: #1f2937;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    .columns-table {
      width: 100%;
      border-collapse: collapse;
    }
    .columns-table th, .columns-table td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    .columns-table th {
      background: #f9fafb;
      font-weight: 600;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      margin-top: 40px;
    }
    .footer p {
      font-size: 10px;
      color: #9ca3af;
    }
    @media print {
      body { print-color-adjust: exact; }
      .page { page-break-after: always; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>📊 InsightGov Africa</h1>
      <div class="org-name">${dataset.organization?.name || 'Organisation'}</div>
      <div class="generated-at">Généré le ${generatedAt}</div>
    </div>

    <div class="summary">
      <h2>${title || dataset.name}</h2>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="value">${dataset.rowCount.toLocaleString('fr-FR')}</div>
          <div class="label">Lignes de données</div>
        </div>
        <div class="summary-item">
          <div class="value">${dataset.columnCount}</div>
          <div class="label">Colonnes</div>
        </div>
        <div class="summary-item">
          <div class="value">${kpis.length}</div>
          <div class="label">KPIs générés</div>
        </div>
      </div>
    </div>

    <div class="columns-section">
      <h2>Structure des données</h2>
      <table class="columns-table">
        <thead>
          <tr>
            <th>Colonne</th>
            <th>Type</th>
            <th>Exemples</th>
          </tr>
        </thead>
        <tbody>
          ${columnsMetadata.slice(0, 10).map((col: { name: string; type: string; sampleValues?: string[] }) => `
            <tr>
              <td>${col.name}</td>
              <td>${col.type}</td>
              <td>${(col.sampleValues || []).slice(0, 2).join(', ') || 'N/A'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p>© 2024 InsightGov Africa - Plateforme de Dashboards Automatisés</p>
      <p>Ce rapport a été généré automatiquement.</p>
    </div>
  </div>
</body>
</html>
  `;
}
