// Local static preview only. The production API remains on Railway.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8'
};

const PUBLIC_FILES = new Set([
    'index.html', '404.html', 'admin.html', 'operator.html',
    'packs-data.json', 'sitemap.xml', 'robots.txt', 'llms.txt',
    'logo.png', 'main.png', 'world.png', 'style.css', 'site-client.js', 'poll.js',
    'poll-results.json',
    'CNAME', '.nojekyll', 'googleb7ecb7d7a588b1da.html'
]);
const PAGE_DIRECTORIES = new Set(['mods', 'resource-packs', 'shaders', 'videos']);
const ASSET_DIRECTORIES = new Set(['assets', 'fonts']);

function isPublicPath(relativePath) {
    const parts = relativePath.split('/');
    if (PUBLIC_FILES.has(relativePath)) return true;
    if (parts.some(part => !part || part.startsWith('.'))) return false;
    if (PAGE_DIRECTORIES.has(parts[0])) {
        return parts.length === 1 || parts.length === 2 || (parts.length === 3 && parts[2] === 'index.html');
    }
    return ASSET_DIRECTORIES.has(parts[0]) && Object.hasOwn(MIME_TYPES, path.posix.extname(relativePath));
}

function contained(rootDir, candidate) {
    const relative = path.relative(rootDir, candidate);
    return relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
}

function createServer({ rootDir = __dirname } = {}) {
    // Use the same native resolution as fs.promises.realpath (also resolves Windows 8.3 paths).
    const root = fs.realpathSync.native(rootDir);
    return http.createServer(async (req, res) => {
        const headers = {
            'Cache-Control': 'no-cache',
            'X-Content-Type-Options': 'nosniff',
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        };
        function reply(status, content, contentType = 'text/plain; charset=utf-8', extra = {}) {
            const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
            res.writeHead(status, { ...headers, 'Content-Type': contentType, 'Content-Length': buffer.length, ...extra });
            res.end(req.method === 'HEAD' ? undefined : buffer);
        }
        async function notFound() {
            try {
                const fallback = await fs.promises.readFile(path.join(root, '404.html'));
                reply(404, fallback, MIME_TYPES['.html']);
            } catch {
                reply(404, '404 Not Found');
            }
        }

        if (req.method !== 'GET' && req.method !== 'HEAD') {
            reply(405, 'Method Not Allowed', undefined, { Allow: 'GET, HEAD' });
            return;
        }

        const rawPath = (req.url || '/').split('?')[0];
        let pathname;
        try { pathname = decodeURIComponent(rawPath); }
        catch { reply(400, 'Bad Request'); return; }
        if (!pathname.startsWith('/') || pathname.startsWith('//') || /[\\\x00-\x1f:]/.test(pathname) || /%(?:2e|2f|5c)/i.test(pathname)) {
            reply(400, 'Bad Request');
            return;
        }
        const segments = pathname.split('/');
        if (segments.some(segment => segment === '..' || segment === '.')) {
            reply(403, 'Forbidden');
            return;
        }
        const relative = pathname.replace(/^\/+|\/+$/g, '') || 'index.html';
        if (!isPublicPath(relative)) { await notFound(); return; }
        let filePath = path.resolve(root, relative);
        if (!contained(root, filePath)) { reply(403, 'Forbidden'); return; }

        try {
            let stats = await fs.promises.stat(filePath);
            if (stats.isDirectory()) {
                if (!pathname.endsWith('/')) {
                    const query = (req.url || '').slice(rawPath.length);
                    reply(308, '', undefined, { Location: rawPath + '/' + query });
                    return;
                }
                filePath = path.join(filePath, 'index.html');
                stats = await fs.promises.stat(filePath);
            }
            const realPath = await fs.promises.realpath(filePath);
            const realRelative = path.relative(root, realPath).split(path.sep).join('/');
            if (!contained(root, realPath) || !isPublicPath(realRelative)) { reply(403, 'Forbidden'); return; }
            if (PAGE_DIRECTORIES.has(realRelative.split('/')[0]) && path.extname(realPath) !== '.html') { await notFound(); return; }
            if (!stats.isFile()) { await notFound(); return; }
            const contentType = MIME_TYPES[path.extname(realPath).toLowerCase()] || 'text/plain; charset=utf-8';
            res.writeHead(200, { ...headers, 'Content-Type': contentType, 'Content-Length': stats.size });
            if (req.method === 'HEAD') { res.end(); return; }
            const stream = fs.createReadStream(realPath);
            stream.on('error', () => res.destroy());
            stream.pipe(res);
        } catch (error) {
            if (error.code === 'ENOENT' || error.code === 'ENOTDIR') await notFound();
            else reply(500, 'Unable to read preview file');
        }
    });
}

if (require.main === module) {
    const port = Number(process.env.PORT || 3000);
    if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('PORT must be an integer between 0 and 65535.');
    const host = process.env.HOST || '127.0.0.1';
    const rootDir = process.env.PREVIEW_ROOT ? path.resolve(process.env.PREVIEW_ROOT) : __dirname;
    const server = createServer({ rootDir });
    server.listen(port, host, () => {
        console.log(`PackCraft preview: http://${host}:${server.address().port}/`);
    });
}

module.exports = { createServer };
