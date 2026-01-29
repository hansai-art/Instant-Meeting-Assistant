// ============================================
// 匯出功能 API
// ============================================

import type { MeetingSession, ExportFormat, ExportOptions } from '@/lib/types';
import { exportToMarkdown } from '@/lib/services/export/markdown';
import { exportToText } from '@/lib/services/export/text';

export async function POST(req: Request) {
  try {
    const { session, options } = (await req.json()) as {
      session: MeetingSession;
      options: ExportOptions;
    };

    // 預設選項
    const exportOptions: ExportOptions = {
      format: options.format || 'markdown',
      includeTranscription: options.includeTranscription ?? true,
      includeSuggestions: options.includeSuggestions ?? true,
      includeStats: options.includeStats ?? true,
      includeTimestamps: options.includeTimestamps ?? true,
    };

    let content: string;
    let contentType: string;
    let fileExtension: string;

    switch (exportOptions.format) {
      case 'markdown':
        content = exportToMarkdown(session, exportOptions);
        contentType = 'text/markdown; charset=utf-8';
        fileExtension = 'md';
        break;

      case 'text':
        content = exportToText(session, exportOptions);
        contentType = 'text/plain; charset=utf-8';
        fileExtension = 'txt';
        break;

      case 'json':
        content = JSON.stringify(
          {
            session,
            exportedAt: new Date().toISOString(),
            options: exportOptions,
          },
          null,
          2
        );
        contentType = 'application/json; charset=utf-8';
        fileExtension = 'json';
        break;

      default:
        throw new Error(`Unsupported export format: ${exportOptions.format}`);
    }

    // 生成檔名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `meeting-${timestamp}.${fileExtension}`;

    return new Response(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Export API Error:', error);
    return Response.json(
      { error: error.message || 'Export failed' },
      { status: 500 }
    );
  }
}
