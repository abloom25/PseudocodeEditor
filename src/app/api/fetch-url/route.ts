import { NextRequest, NextResponse } from 'next/server';
import { FetchClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import * as Sentry from '@sentry/nextjs';

export async function POST(request: NextRequest) {
  const startedAt = performance.now();
  let status = 500;

  try {
    const { url } = await request.json();

    if (!url) {
      status = 400;
      return NextResponse.json({ error: 'URL is required' }, { status });
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new FetchClient(config, customHeaders);

    const response = await client.fetch(url);

    // 提取所有文本内容
    const textContent = response.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\n');

    status = 200;
    return NextResponse.json({
      success: true,
      title: response.title,
      filetype: response.filetype,
      content: textContent,
      url: response.url,
      status_code: response.status_code,
    });
  } catch (error) {
    console.error('Fetch error:', error);
    status = 500;
    return NextResponse.json(
      { error: 'Failed to fetch URL content', details: String(error) },
      { status }
    );
  } finally {
    Sentry.metrics.count('api_request', 1, {
      attributes: {
        route: '/api/fetch-url',
        method: 'POST',
        status,
      },
    });
    Sentry.metrics.distribution(
      'api_response_time',
      performance.now() - startedAt,
      {
        unit: 'millisecond',
        attributes: {
          route: '/api/fetch-url',
          method: 'POST',
          status,
        },
      },
    );
  }
}
