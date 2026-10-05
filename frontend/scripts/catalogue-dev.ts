import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { promisify } from 'node:util';
import type { Plugin } from 'vite';
import site from '../src/site.json';

const run = promisify(execFile);

// Catalogue pages are generated HTML, so Vite's SPA fallback cannot render them.
export function catalogueDevPlugin(): Plugin {
  return {
    name: 'catalogue-pages-dev',
    apply: 'serve',
    configureServer(server) {
      const root = server.config.root;
      const scripts = join(root, 'scripts');
      const data = resolve(root, '../backend/src/main/resources/data');
      const output = join(root, 'node_modules/.cache/brazil-pages');
      let generation: Promise<unknown> | undefined;

      server.watcher.add([scripts, data]);
      server.watcher.on('all', (_event, path) => {
        if (path.startsWith(scripts + sep) || path.startsWith(data + sep)) {
          generation = undefined;
          server.ws.send({ type: 'full-reload' });
        }
      });

      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next();
        const path = (req.url ?? '/').split('?')[0].replace(/\/+$/, '');
        const catalogue = /^\/(?:en\/)?(?:ideologies|personalities|countries|candidatos|election-methodology)(?:\/[a-z0-9-]+)?(?:\.html)?$/.test(path);
        const stylesheet = path === '/election-profile.css';
        if (!catalogue && !stylesheet) return next();

        try {
          const identifier = path.match(/^\/(?:en\/)?candidatos\/([a-z0-9-]+)(?:\.html)?$/)?.[1];
          if (/^\/(?:en\/)?(?:ideologies|countries|personalities)/.test(path)
            || /^\/(?:en\/)?candidatos(?:\.html)?$/.test(path)
            || (identifier && !site.candidates.some(candidate => candidate.id === identifier))) {
            res.statusCode = 404;
            res.end('Page unavailable in 2 Turno');
            return;
          }
          generation ??= run(process.execPath, [join(scripts, 'generate-brazil-pages.cjs'), '--catalogue-only']);
          await generation;
          const file = stylesheet || path.endsWith('.html') ? path : `${path}.html`;
          const content = await readFile(join(output, file));
          res.setHeader('Content-Type', stylesheet ? 'text/css; charset=utf-8' : 'text/html; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache');
          const body = stylesheet ? content : await server.transformIndexHtml(path, content.toString());
          res.end(req.method === 'HEAD' ? undefined : body);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            res.statusCode = 404;
            res.end('Catalogue page not found');
          } else {
            generation = undefined;
            next(error);
          }
        }
      });
    }
  };
}
