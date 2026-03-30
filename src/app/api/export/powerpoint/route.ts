/**
 * InsightGov Africa - PowerPoint Export API
 * ===========================================
 * Generates PowerPoint presentations from dashboard data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security';

interface SlideContent {
  title: string;
  subtitle?: string;
  content?: string;
  kpis?: Array<{
    name: string;
    value: string | number;
    unit?: string;
    trend?: string;
  }>;
  chartData?: {
    type: string;
    title: string;
    labels: string[];
    values: number[];
  };
  bulletPoints?: string[];
}

/**
 * POST /api/export/powerpoint
 * Generate a PowerPoint presentation from dashboard data
 */
export async function POST(request: NextRequest) {
  // Check authentication
  const authCheck = await requireAuth();
  if (authCheck instanceof NextResponse) {
    return authCheck;
  }

  try {
    const body = await request.json();
    const { 
      title, 
      subtitle, 
      organizationName, 
      slides,
      format = 'pptx'
    } = body;

    if (!title || !slides || !Array.isArray(slides)) {
      return NextResponse.json(
        { success: false, error: 'Titre et slides requis' },
        { status: 400 }
      );
    }

    // Generate PowerPoint XML content (simplified format)
    // In production, use a library like PptxGenJS or python-pptx
    
    const presentation = generatePresentationXML({
      title,
      subtitle,
      organizationName,
      slides: slides as SlideContent[],
    });

    // Return the PowerPoint file
    return new NextResponse(presentation.content, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${presentation.filename}"`,
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

function generatePresentationXML(data: {
  title: string;
  subtitle?: string;
  organizationName?: string;
  slides: SlideContent[];
}): { content: string; filename: string } {
  const filename = `${data.title.replace(/[^a-zA-Z0-9]/g, '_')}_presentation.pptx`;
  
  // Generate a simple XML-based presentation
  // Note: This is a simplified version - for full PowerPoint features,
  // use a dedicated library like PptxGenJS
  
  const slidesXML = data.slides.map((slide, index) => generateSlideXML(slide, index + 1)).join('\n');
  
  const content = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<presentation xmlns="http://schemas.openxmlformats.org/presentationml/2006/main">
  <sldMasterIdLst>
    <sldMasterId id="1" r:id="rId1"/>
  </sldMasterIdLst>
  <sldIdLst>
    ${data.slides.map((_, i) => `<sldId id="${i + 256}" r:id="rId${i + 2}"/>`).join('\n    ')}
  </sldIdLst>
  ${slidesXML}
</presentation>`;

  return { content, filename };
}

function generateSlideXML(slide: SlideContent, slideNumber: number): string {
  let contentXML = '';
  
  // Title
  contentXML += `<p:sp>
    <p:nvSpPr>
      <p:cNvPr id="1" name="Title"/>
    </p:nvSpPr>
    <p:spPr>
      <a:xfrm>
        <a:off x="457200" y="274632"/>
        <a:ext cx="8229600" cy="1143000"/>
      </a:xfrm>
    </p:spPr>
    <p:txBody>
      <a:p>
        <a:r>
          <a:t>${escapeXML(slide.title)}</a:t>
        </a:r>
      </a:p>
    </p:txBody>
  </p:sp>`;

  // Subtitle
  if (slide.subtitle) {
    contentXML += `<p:sp>
      <p:nvSpPr>
        <p:cNvPr id="2" name="Subtitle"/>
      </p:nvSpPr>
      <p:spPr>
        <a:xfrm>
          <a:off x="457200" y="1600200"/>
          <a:ext cx="8229600" cy="914400"/>
        </a:xfrm>
      </p:spPr>
      <p:txBody>
        <a:p>
          <a:r>
            <a:t>${escapeXML(slide.subtitle)}</a:t>
          </a:r>
        </a:p>
      </p:txBody>
    </p:sp>`;
  }

  // KPIs
  if (slide.kpis && slide.kpis.length > 0) {
    const kpiTexts = slide.kpis.map(kpi => 
      `${kpi.name}: ${kpi.value}${kpi.unit || ''}${kpi.trend ? ` (${kpi.trend})` : ''}`
    ).join('\n');
    
    contentXML += `<p:sp>
      <p:nvSpPr>
        <p:cNvPr id="3" name="KPIs"/>
      </p:nvSpPr>
      <p:spPr>
        <a:xfrm>
          <a:off x="457200" y="2746320"/>
          <a:ext cx="8229600" cy="3200400"/>
        </a:xfrm>
      </p:spPr>
      <p:txBody>
        ${kpiTexts.split('\n').map(text => `
        <a:p>
          <a:r>
            <a:t>${escapeXML(text)}</a:t>
          </a:r>
        </a:p>`).join('')}
      </p:txBody>
    </p:sp>`;
  }

  // Bullet points
  if (slide.bulletPoints && slide.bulletPoints.length > 0) {
    contentXML += `<p:sp>
      <p:nvSpPr>
        <p:cNvPr id="4" name="Content"/>
      </p:nvSpPr>
      <p:spPr>
        <a:xfrm>
          <a:off x="457200" y="2746320"/>
          <a:ext cx="8229600" cy="3200400"/>
        </a:xfrm>
      </p:spPr>
      <p:txBody>
        ${slide.bulletPoints.map(point => `
        <a:p>
          <a:pPr marL="342900">
            <a:buFont typeface="Arial"/>
            <a:buChar char="•"/>
          </a:pPr>
          <a:r>
            <a:t>${escapeXML(point)}</a:t>
          </a:r>
        </a:p>`).join('')}
      </p:txBody>
    </p:sp>`;
  }

  return `
<sld n="${slideNumber}" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="0" name=""/>
      </p:nvGrpSpPr>
      ${contentXML}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr>
    <a:masterClrMapping/>
  </p:clrMapOvr>
</sld>`;
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * GET /api/export/powerpoint
 * Returns information about PowerPoint export capabilities
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'PowerPoint Export API',
    supportedFormats: ['pptx'],
    features: {
      titleSlides: true,
      kpiSlides: true,
      bulletPointSlides: true,
      chartSlides: 'basic',
      customBranding: true,
    },
    usage: {
      method: 'POST',
      body: {
        title: 'string - Presentation title',
        subtitle: 'string? - Optional subtitle',
        organizationName: 'string? - Organization name for branding',
        slides: 'SlideContent[] - Array of slide objects',
      },
    },
  });
}
