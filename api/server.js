// Vercel serverless function for TanStack Start
// This imports the built server entry from dist/server/server.js

// Use dynamic import for ESM compatibility
let serverEntry;

export default async function handler(req, res) {
  try {
    // Lazy load the server entry (ESM module)
    if (!serverEntry) {
      const module = await import('../dist/server/server.js');
      serverEntry = module.default;
    }
    
    // Build the full URL
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const url = `${protocol}://${host}${req.url}`;
    
    // Convert Vercel's req to a standard Request object
    const headers = new Headers();
    Object.keys(req.headers).forEach((key) => {
      const value = req.headers[key];
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
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      // Vercel already parses JSON, but we need to send it as a string to Request
      if (req.body) {
        if (typeof req.body === 'string') {
          body = req.body;
        } else if (Buffer.isBuffer(req.body)) {
          body = req.body.toString();
        } else {
          // For JSON objects, stringify them
          body = JSON.stringify(req.body);
        }
      } else if (req.rawBody) {
        // Use raw body if available (for non-JSON content)
        body = typeof req.rawBody === 'string' ? req.rawBody : req.rawBody.toString();
      }
    }
    
    // Create a standard Request object
    const request = new Request(url, {
      method: req.method,
      headers,
      body,
    });

    // Call the TanStack Start server handler
    const response = await serverEntry.fetch(request);
    
    // Copy response headers to Vercel response
    response.headers.forEach((value, key) => {
      // Skip headers that Vercel manages
      if (key.toLowerCase() !== 'content-encoding') {
        res.setHeader(key, value);
      }
    });
    
    // Set status code
    res.status(response.status);
    
    // Get response body
    const responseBody = await response.text();
    res.send(responseBody);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

