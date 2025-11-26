// Netlify serverless function for TanStack Start
// This imports the built server entry from dist/server/server.js
import { join } from 'node:path';

// Use dynamic import for ESM compatibility
let serverEntry;

export const handler = async (event, context) => {
  try {
    // Lazy load the server entry (ESM module)
    // Try relative path first, then absolute path
    if (!serverEntry) {
      try {
        const module = await import('../../dist/server/server.js');
        serverEntry = module.default;
      } catch (importError) {
        // Fallback to absolute path if relative doesn't work
        const serverPath = join(process.cwd(), 'dist', 'server', 'server.js');
        const module = await import(serverPath);
        serverEntry = module.default;
      }
    }
    
    // Build the full URL
    const protocol = event.headers['x-forwarded-proto'] || 'https';
    const host = event.headers['x-forwarded-host'] || event.headers.host || event.headers['Host'];
    const path = event.path || event.rawPath || '/';
    const queryString = event.rawQuery ? `?${event.rawQuery}` : '';
    const url = `${protocol}://${host}${path}${queryString}`;
    
    // Convert Netlify's event to a standard Request object
    const headers = new Headers();
    Object.keys(event.headers || {}).forEach((key) => {
      const value = event.headers[key];
      if (value) {
        if (Array.isArray(value)) {
          value.forEach((v) => headers.append(key, v));
        } else {
          headers.set(key, value);
        }
      }
    });
    
    // Get request body
    let body = undefined;
    if (event.body && event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD') {
      body = typeof event.body === 'string' ? event.body : JSON.stringify(event.body);
    }
    
    // Create a standard Request object
    const request = new Request(url, {
      method: event.httpMethod || 'GET',
      headers,
      body,
    });

    // Call the TanStack Start server handler
    const response = await serverEntry.fetch(request);
    
    // Convert response to Netlify format
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    
    // Get response body
    const responseBody = await response.text();
    
    return {
      statusCode: response.status,
      headers: responseHeaders,
      body: responseBody,
    };
  } catch (error) {
    console.error('Server error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
    };
  }
};

