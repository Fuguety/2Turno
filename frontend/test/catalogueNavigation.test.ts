import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type ViteDevServer } from 'vite';
import { catalogueDevPlugin } from '../scripts/catalogue-dev';
import { brazilPublicPlugin } from '../scripts/brazil-public';

describe('local 2 Turno navigation', () => {
  let server: ViteDevServer;
  let base: string;

  beforeAll(async () => {
    server = await createServer({
      configFile: false,
      root: fileURLToPath(new URL('..', import.meta.url)),
      publicDir: false,
      plugins: [brazilPublicPlugin(), catalogueDevPlugin()],
      // These HTTP tests do not load browser modules; avoid starting unused dependency warmups.
      server: { host: '127.0.0.1', port: 0, preTransformRequests: false }
    });
    await server.listen();
    base = server.resolvedUrls!.local[0];

    // A cold cache generates every static page; allow extra time on CI runners.
    const response = await fetch(`${base}election-methodology`);
    expect(response.status).toBe(200);
    await response.text();
  }, 60_000);

  afterAll(async () => {
    server?.httpServer?.closeAllConnections();
    await server?.close();
  });

  it.each(['candidatos/lula-da-silva', 'candidatos/flavio-bolsonaro', 'election-methodology'])('serves %s in both languages instead of the quiz homepage', async (page) => {
    for (const prefix of ['', 'en/']) {
      const response = await fetch(`${base}${prefix}${page}`);
      const html = await response.text();
      expect(response.status).toBe(200);
      expect(html).toContain('2 Turno');
      expect(html.replace(/https:\/\/12axes\.vercel\.app/g, '')).not.toMatch(/12 ?Axes/);
      expect(html).not.toContain('/src/main.tsx');
      expect(html).toContain(`/${prefix}candidatos/flavio-bolsonaro`);
      expect(html).not.toContain('/personalities');
    }
  });

  it('links each axis to the cited page of the candidate programme', async () => {
    const html = await (await fetch(`${base}candidatos/flavio-bolsonaro`)).text();
    expect(html).toContain('https://planodegoverno2026.com.br/planos/flavio-bolsonaro-0a34723b.pdf#page=65');
    expect(html).toContain('o plano de governo não trata do tema');
  });

  it('serves detail pages, clean URL aliases and generated styles', async () => {
    for (const path of ['en/candidatos/lula-da-silva', 'candidatos/flavio-bolsonaro.html', 'election-methodology.html', 'election-profile.css']) {
      const response = await fetch(base + path);
      expect(response.status).toBe(200);
      expect(await response.text()).not.toContain('/src/main.tsx');
    }
    expect((await fetch(base + 'election-profile.css')).headers.get('content-type')).toContain('text/css');
  });

  it('keeps the quiz homepage and returns 404 for anyone but the two candidates', async () => {
    const home = await (await fetch(base)).text();
    expect(home).toContain('/src/main.tsx');
    expect(home).toContain('<title>2 Turno');
    for (const path of ['en/candidatos/ciro-gomes', 'candidatos/jair-bolsonaro', 'candidatos']) {
      expect((await fetch(base + path)).status).toBe(404);
    }
  });

  it('rejects international catalogues and direct foreign profile URLs', async () => {
    for (const path of ['ideologies', 'countries', 'en/countries', 'personalities', 'personalities/lula-da-silva', 'en/personalities/javier-milei.html']) {
      expect((await fetch(base + path)).status).toBe(404);
    }
  });

  it('serves only the candidate portraits in development', async () => {
    const portrait = await fetch(base + 'fotos/lula-da-silva.jpg');
    expect(portrait.status).toBe(200);
    expect(portrait.headers.get('content-type')).toContain('image/jpeg');
    await portrait.arrayBuffer();
    for (const path of ['fotos/ciro-gomes.jpg', 'personalities/portraits/lula-da-silva.jpg', 'personalities/portraits/donald-trump.jpg']) {
      expect((await fetch(base + path)).status).toBe(404);
    }
  });
});
