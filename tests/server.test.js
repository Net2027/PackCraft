const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { once } = require('node:events');
const { createServer } = require('../server.js');

function request(port, urlPath, method = 'GET') {
    return new Promise((resolve, reject) => {
        const req = http.request({ hostname: '127.0.0.1', port, path: urlPath, method }, res => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }));
        });
        req.on('error', reject);
        req.end();
    });
}

test('preview serves public pages while protecting repository and encoded paths', async t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'packcraft-preview-test-'));
    fs.mkdirSync(path.join(root, 'mods', 'مود-تازه'), { recursive: true });
    fs.mkdirSync(path.join(root, '.review'));
    fs.writeFileSync(path.join(root, 'index.html'), '<h1>Home</h1>');
    fs.writeFileSync(path.join(root, '404.html'), '<h1>Missing</h1>');
    fs.writeFileSync(path.join(root, 'mods', 'مود-تازه', 'index.html'), '<h1>مود تازه</h1>');
    fs.writeFileSync(path.join(root, 'operators.json'), '{"private":"DO-NOT-SERVE"}');
    fs.writeFileSync(path.join(root, 'server.js'), 'private-server-code');
    fs.writeFileSync(path.join(root, '.review', 'notes.txt'), 'private-notes');
    fs.writeFileSync(path.join(root, 'packs-data.json'), '{"mods":[]}');
    const server = createServer({ rootDir: root });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const port = server.address().port;
    t.after(async () => {
        await new Promise(resolve => server.close(resolve));
        // This path was created by this test directly beneath os.tmpdir().
        fs.rmSync(root, { recursive: true, force: true });
    });

    await t.test('public home, Persian slug, HEAD, and catalog remain usable', async () => {
        const home = await request(port, '/');
        assert.equal(home.status, 200);
        assert.equal(home.body, '<h1>Home</h1>');
        assert.match(home.headers['content-type'], /text\/html.*utf-8/);
        assert.equal(home.headers['x-content-type-options'], 'nosniff');
        assert.equal((await request(port, '/mods/' + encodeURIComponent('مود-تازه') + '/')).body, '<h1>مود تازه</h1>');
        const head = await request(port, '/', 'HEAD');
        assert.equal(head.status, 200);
        assert.equal(head.body, '');
        assert.equal(Number(head.headers['content-length']), Buffer.byteLength(home.body));
        assert.equal((await request(port, '/packs-data.json')).status, 200);
    });

    await t.test('directory redirects keep the query and missing pages return a real 404', async () => {
        const redirected = await request(port, '/mods/' + encodeURIComponent('مود-تازه') + '?q=a');
        assert.equal(redirected.status, 308);
        assert.equal(redirected.headers.location, '/mods/' + encodeURIComponent('مود-تازه') + '/?q=a');
        const missing = await request(port, '/not-a-page');
        assert.equal(missing.status, 404);
        assert.equal(missing.body, '<h1>Missing</h1>');
    });

    await t.test('private source/account files never enter a response', async () => {
        for (const urlPath of ['/operators.json', '/server.js', '/.review/notes.txt', '/.git/config', '/tests/server.test.js']) {
            const response = await request(port, urlPath);
            assert.equal(response.status, 404, urlPath);
            assert.doesNotMatch(response.body, /DO-NOT-SERVE|private-/);
        }
    });

    await t.test('raw and encoded traversal, Windows separators, invalid encoding are rejected', async () => {
        for (const urlPath of ['/../operators.json', '/mods/%2e%2e/operators.json', '/mods/..%2foperators.json']) {
            assert.equal((await request(port, urlPath)).status, 403, urlPath);
        }
        for (const urlPath of ['/mods/%5c..%5coperators.json', '/%252e%252e/operators.json', '/bad%zz', '/C:%5cWindows', '/%00']) {
            assert.equal((await request(port, urlPath)).status, 400, urlPath);
        }
    });

    await t.test('API writes are not handled by the static preview', async () => {
        const response = await request(port, '/api/admin/mods', 'POST');
        assert.equal(response.status, 405);
        assert.equal(response.headers.allow, 'GET, HEAD');
    });
});
