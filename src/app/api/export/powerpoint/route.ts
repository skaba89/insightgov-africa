/**
 * InsightGov Africa - PowerPoint Export API
 * ===========================================
 * Generates professional PowerPoint presentations from dashboard data
 * using PptxGenJS library for full PowerPoint compatibility
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { logAudit, AuditAction } from '@/lib/audit-logger';
import PptxGenJS from 'pptxgenjs';

interface KPICard {
  name: string;
  value: string | number;
  unit?: string;
  trend?: string;
  change?: number;
}

interface ChartSlide {
  type: 'bar' | 'line' | 'pie' | 'donut';
  title: string;
  labels: string[];
  values: number[];
  colors?: string[];
}

interface SlideContent {
  type: 'title' | 'kpi' | 'chart' | 'bullet' | 'table' | 'conclusion';
  title: string;
  subtitle?: string;
  kpis?: KPICard[];
  chartData?: ChartSlide;
  bulletPoints?: string[];
  tableData?: {
    headers: string[];
    rows: string[][];
  };
  notes?: string;
}

interface PresentationRequest {
  title: string;
  subtitle?: string;
  organizationName?: string;
  organizationLogo?: string;
  slides: SlideContent[];
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
  };
}

// Default theme colors
const DEFAULT_THEME = {
  primaryColor: '1F4E79', // Dark blue
  secondaryColor: '3B82F6', // Blue
  accentColor: '10B981', // Green
  textColor: '1F2937', // Gray-800
  lightGray: 'F3F4F6', // Gray-100
};

/**
 * POST /api/export/powerpoint
 * Generate a professional PowerPoint presentation
 */
export async function POST(request: NextRequest) {
  // Check authentication
  const authResult = await requireAuth(request, 'read');
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { auth } = authResult;

  try {
    const body: PresentationRequest = await request.json();
    const { 
      title, 
      subtitle, 
      organizationName, 
      organizationLogo,
      slides,
      theme = {}
    } = body;

    if (!title || !slides || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Titre et slides requis' },
        { status: 400 }
      );
    }

    // Merge theme with defaults
    const presentationTheme = { ...DEFAULT_THEME, ...theme };

    // Create presentation
    const pptx = new PptxGenJS();
    
    // Set presentation properties
    pptx.author = organizationName || 'InsightGov Africa';
    pptx.company = organizationName || 'InsightGov Africa';
    pptx.subject = title;
    pptx.title = title;
    pptx.layout = 'LAYOUT_16x9';

    // Define master slides
    pptx.defineSlideMaster({
      title: 'TITLE_SLIDE',
      background: { color: presentationTheme.primaryColor },
      objects: [
        { rect: { x: 0, y: '85%', w: '100%', h: '15%', fill: { color: presentationTheme.secondaryColor } } },
        { text: { text: organizationName || 'InsightGov Africa', options: { x: 0.5, y: '90%', w: 9, h: 0.5, color: 'FFFFFF', fontSize: 12 } } },
      ],
    });

    pptx.defineSlideMaster({
      title: 'CONTENT_SLIDE',
      background: { color: 'FFFFFF' },
      objects: [
        { rect: { x: 0, y: 0, w: '100%', h: 1.2, fill: { color: presentationTheme.primaryColor } } },
        { rect: { x: 0, y: '95%', w: '100%', h: '5%', fill: { color: presentationTheme.lightGray } } },
      ],
    });

    // Generate slides
    for (let i = 0; i < slides.length; i++) {
      const slideContent = slides[i];
      
      switch (slideContent.type) {
        case 'title':
          addTitleSlide(pptx, slideContent, presentationTheme, organizationName);
          break;
        case 'kpi':
          addKPISlide(pptx, slideContent, presentationTheme);
          break;
        case 'chart':
          addChartSlide(pptx, slideContent, presentationTheme);
          break;
        case 'bullet':
          addBulletSlide(pptx, slideContent, presentationTheme);
          break;
        case 'table':
          addTableSlide(pptx, slideContent, presentationTheme);
          break;
        case 'conclusion':
          addConclusionSlide(pptx, slideContent, presentationTheme, organizationName);
          break;
        default:
          addContentSlide(pptx, slideContent, presentationTheme);
      }
    }

    // Generate buffer
    const buffer = await pptx.write({ outputType: 'base64' });
    const base64Data = buffer as string;
    
    // Convert base64 to buffer
    const fileBuffer = Buffer.from(base64Data, 'base64');

    // Log export
    await logAudit({
      action: AuditAction.DATASET_EXPORT,
      description: `PowerPoint exported: ${title}`,
      userId: auth.userId,
      organizationId: auth.organizationId,
      metadata: { 
        slideCount: slides.length,
        format: 'pptx'
      },
    });

    // Return the PowerPoint file
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${sanitizeFilename(title)}_presentation.pptx"`,
        'Content-Length': String(fileBuffer.length),
      },
    });
  } catch (error) {
    console.error('PowerPoint generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la génération du PowerPoint' },
      { status: 500 }
    );
  }
}

/**
 * Add title slide
 */
function addTitleSlide(
  pptx: PptxGenJS,
  slide: SlideContent,
  theme: typeof DEFAULT_THEME,
  orgName?: string
): void {
  const pptSlide = pptx.addSlide({ masterName: 'TITLE_SLIDE' });
  
  pptSlide.addText(slide.title, {
    x: 0.5,
    y: '35%',
    w: 9,
    h: 1.5,
    fontSize: 44,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
  });
  
  if (slide.subtitle) {
    pptSlide.addText(slide.subtitle, {
      x: 0.5,
      y: '55%',
      w: 9,
      h: 0.8,
      fontSize: 24,
      color: 'FFFFFF',
      align: 'center',
    });
  }
  
  if (orgName) {
    pptSlide.addText(orgName, {
      x: 0.5,
      y: '90%',
      w: 9,
      h: 0.4,
      fontSize: 14,
      color: 'FFFFFF',
      align: 'center',
    });
  }
}

/**
 * Add KPI dashboard slide
 */
function addKPISlide(
  pptx: PptxGenJS,
  slide: SlideContent,
  theme: typeof DEFAULT_THEME
): void {
  const pptSlide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
  
  // Title
  pptSlide.addText(slide.title, {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 28,
    bold: true,
    color: 'FFFFFF',
  });
  
  if (!slide.kpis || slide.kpis.length === 0) return;
  
  // Calculate grid layout
  const kpiCount = slide.kpis.length;
  const cols = Math.min(kpiCount, 4);
  const rows = Math.ceil(kpiCount / cols);
  const cardWidth = 9 / cols - 0.3;
  const cardHeight = Math.min(2, 4 / rows);
  
  slide.kpis.forEach((kpi, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = 0.5 + col * (cardWidth + 0.2);
    const y = 1.5 + row * (cardHeight + 0.2);
    
    // KPI card background
    pptSlide.addShape(pptx.ShapeType.rect, {
      x,
      y,
      w: cardWidth,
      h: cardHeight,
      fill: { color: theme.lightGray },
      line: { color: theme.secondaryColor, pt: 1 },
    });
    
    // KPI name
    pptSlide.addText(kpi.name, {
      x: x + 0.1,
      y: y + 0.1,
      w: cardWidth - 0.2,
      h: 0.4,
      fontSize: 12,
      color: theme.textColor,
    });
    
    // KPI value
    const valueText = `${kpi.value}${kpi.unit || ''}`;
    pptSlide.addText(valueText, {
      x: x + 0.1,
      y: y + 0.5,
      w: cardWidth - 0.2,
      h: 0.8,
      fontSize: 32,
      bold: true,
      color: theme.primaryColor,
    });
    
    // Trend indicator
    if (kpi.trend || kpi.change !== undefined) {
      const trendColor = kpi.change && kpi.change >= 0 ? theme.accentColor : 'EF4444';
      const trendText = kpi.trend || (kpi.change && kpi.change >= 0 ? `+${kpi.change}%` : `${kpi.change}%`);
      
      pptSlide.addText(trendText, {
        x: x + 0.1,
        y: y + cardHeight - 0.4,
        w: cardWidth - 0.2,
        h: 0.3,
        fontSize: 14,
        color: trendColor,
      });
    }
  });
  
  // Add notes if provided
  if (slide.notes) {
    pptSlide.addNotes(slide.notes);
  }
}

/**
 * Add chart slide
 */
function addChartSlide(
  pptx: PptxGenJS,
  slide: SlideContent,
  theme: typeof DEFAULT_THEME
): void {
  const pptSlide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
  
  // Title
  pptSlide.addText(slide.title, {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 28,
    bold: true,
    color: 'FFFFFF',
  });
  
  if (!slide.chartData) return;
  
  const { type, title, labels, values, colors } = slide.chartData;
  const chartColors = colors || [theme.primaryColor, theme.secondaryColor, theme.accentColor];
  
  const chartData = [{
    name: title,
    labels: labels,
    values: values,
  }];
  
  const chartOptions: any = {
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 4,
    title: title,
    chartColors: chartColors,
  };
  
  switch (type) {
    case 'bar':
      pptSlide.addChart(pptx.ChartType.bar, chartData, chartOptions);
      break;
    case 'line':
      pptSlide.addChart(pptx.ChartType.line, chartData, chartOptions);
      break;
    case 'pie':
      pptSlide.addChart(pptx.ChartType.pie, chartData, chartOptions);
      break;
    case 'donut':
      pptSlide.addChart(pptx.ChartType.doughnut, chartData, chartOptions);
      break;
    default:
      pptSlide.addChart(pptx.ChartType.bar, chartData, chartOptions);
  }
}

/**
 * Add bullet point slide
 */
function addBulletSlide(
  pptx: PptxGenJS,
  slide: SlideContent,
  theme: typeof DEFAULT_THEME
): void {
  const pptSlide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
  
  // Title
  pptSlide.addText(slide.title, {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 28,
    bold: true,
    color: 'FFFFFF',
  });
  
  if (!slide.bulletPoints || slide.bulletPoints.length === 0) return;
  
  // Bullet points
  const bulletText = slide.bulletPoints.map(point => ({
    text: point,
    options: {
      bullet: { type: 'bullet', color: theme.secondaryColor },
      indentLevel: 0,
    },
  }));
  
  pptSlide.addText(bulletText as any, {
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 4,
    fontSize: 18,
    color: theme.textColor,
    paraSpaceAfter: 10,
  });
}

/**
 * Add table slide
 */
function addTableSlide(
  pptx: PptxGenJS,
  slide: SlideContent,
  theme: typeof DEFAULT_THEME
): void {
  const pptSlide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
  
  // Title
  pptSlide.addText(slide.title, {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 28,
    bold: true,
    color: 'FFFFFF',
  });
  
  if (!slide.tableData) return;
  
  const { headers, rows } = slide.tableData;
  
  // Prepare table data
  const tableData = [
    headers.map(h => ({ text: h, options: { bold: true, fill: { color: theme.primaryColor }, color: 'FFFFFF' } })),
    ...rows.map(row => row.map(cell => ({ text: cell }))),
  ];
  
  pptSlide.addTable(tableData, {
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 3,
    border: { type: 'solid', pt: 1, color: theme.lightGray },
    fontFace: 'Arial',
    fontSize: 12,
    align: 'center',
    valign: 'middle',
  });
}

/**
 * Add conclusion slide
 */
function addConclusionSlide(
  pptx: PptxGenJS,
  slide: SlideContent,
  theme: typeof DEFAULT_THEME,
  orgName?: string
): void {
  const pptSlide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
  
  // Title
  pptSlide.addText(slide.title || 'Conclusion', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 28,
    bold: true,
    color: 'FFFFFF',
  });
  
  if (slide.bulletPoints && slide.bulletPoints.length > 0) {
    const bulletText = slide.bulletPoints.map(point => ({
      text: point,
      options: {
        bullet: { type: 'bullet', color: theme.accentColor },
        indentLevel: 0,
      },
    }));
    
    pptSlide.addText(bulletText as any, {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 3,
      fontSize: 20,
      color: theme.textColor,
      paraSpaceAfter: 15,
    });
  }
  
  // Footer
  if (orgName) {
    pptSlide.addText(`Generated by InsightGov Africa for ${orgName}`, {
      x: 0.5,
      y: 5,
      w: 9,
      h: 0.4,
      fontSize: 10,
      color: theme.textColor,
      align: 'center',
    });
  }
}

/**
 * Add generic content slide
 */
function addContentSlide(
  pptx: PptxGenJS,
  slide: SlideContent,
  theme: typeof DEFAULT_THEME
): void {
  const pptSlide = pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
  
  pptSlide.addText(slide.title, {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 28,
    bold: true,
    color: 'FFFFFF',
  });
  
  if (slide.subtitle) {
    pptSlide.addText(slide.subtitle, {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 0.5,
      fontSize: 18,
      color: theme.textColor,
    });
  }
}

/**
 * Sanitize filename
 */
function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
}

/**
 * GET /api/export/powerpoint
 * Returns information about PowerPoint export capabilities
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'PowerPoint Export API - Fully Featured',
    supportedFormats: ['pptx'],
    features: {
      titleSlides: true,
      kpiSlides: true,
      chartSlides: ['bar', 'line', 'pie', 'donut'],
      bulletPointSlides: true,
      tableSlides: true,
      conclusionSlides: true,
      customBranding: true,
      customThemes: true,
      speakerNotes: true,
    },
    slideTypes: [
      { type: 'title', description: 'Title slide with optional subtitle' },
      { type: 'kpi', description: 'KPI dashboard with metric cards' },
      { type: 'chart', description: 'Chart visualization (bar, line, pie, donut)' },
      { type: 'bullet', description: 'Bullet point content slide' },
      { type: 'table', description: 'Data table slide' },
      { type: 'conclusion', description: 'Summary/conclusion slide' },
    ],
    themeOptions: {
      primaryColor: 'Main color (default: 1F4E79)',
      secondaryColor: 'Accent color (default: 3B82F6)',
      accentColor: 'Highlight color (default: 10B981)',
    },
    usage: {
      method: 'POST',
      body: {
        title: 'string - Presentation title',
        subtitle: 'string? - Optional subtitle',
        organizationName: 'string? - Organization name',
        slides: 'SlideContent[] - Array of slide objects',
        theme: 'object? - Custom theme colors',
      },
    },
  });
}
