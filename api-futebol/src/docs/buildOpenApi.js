const fs = require('fs');
const path = require('path');

const BASE_PATH_BY_ROUTE_FILE = {
  jogadores: '/api/jogadores',
  times: '/api/times',
  rodadas: '/api/rodadas',
  partidas: '/api/partidas',
};

const TAG_BY_ROUTE_FILE = {
  jogadores: 'Jogadores',
  times: 'Times',
  rodadas: 'Rodadas',
  partidas: 'Partidas',
};

const ROUTE_REGEX = /router\.(get|post|put|delete|patch)\(\s*['\"]([^'\"]+)['\"]/g;

const toOpenApiPath = (basePath, routePath) => {
  const normalizedRoute = routePath
    .replace(/:([a-zA-Z0-9_]+)/g, '{$1}')
    .replace(/\/$/, '');

  if (normalizedRoute === '/' || normalizedRoute === '') return basePath;
  return `${basePath}${normalizedRoute.startsWith('/') ? normalizedRoute : `/${normalizedRoute}`}`;
};

const methodSummary = (method, fullPath) => `${method.toUpperCase()} ${fullPath}`;

const isSearchEndpoint = (fullPath) => /\/search$/.test(fullPath);

const parseRoutesFromFile = (fileName, content) => {
  const key = path.basename(fileName, '.js');
  const basePath = BASE_PATH_BY_ROUTE_FILE[key];
  const tag = TAG_BY_ROUTE_FILE[key] || 'API';

  if (!basePath) return [];

  const entries = [];
  let match;

  while ((match = ROUTE_REGEX.exec(content)) !== null) {
    const method = String(match[1] || '').toLowerCase();
    const routePath = String(match[2] || '');
    const fullPath = toOpenApiPath(basePath, routePath);

    entries.push({ method, fullPath, tag });
  }

  return entries;
};

const readRouteEntries = () => {
  const routesDir = path.resolve(__dirname, '../routes');
  const files = fs.readdirSync(routesDir).filter((name) => name.endsWith('.js'));

  return files.flatMap((fileName) => {
    const filePath = path.join(routesDir, fileName);
    const content = fs.readFileSync(filePath, 'utf8');
    return parseRoutesFromFile(fileName, content);
  });
};

const ensureTags = (spec, routeEntries) => {
  const existing = new Set((spec.tags || []).map((t) => t.name));
  for (const entry of routeEntries) {
    if (existing.has(entry.tag)) continue;
    spec.tags = spec.tags || [];
    spec.tags.push({ name: entry.tag, description: `Operacoes de ${entry.tag.toLowerCase()}` });
    existing.add(entry.tag);
  }
};

const ensurePaths = (spec, routeEntries) => {
  spec.paths = spec.paths || {};

  for (const entry of routeEntries) {
    spec.paths[entry.fullPath] = spec.paths[entry.fullPath] || {};
    if (spec.paths[entry.fullPath][entry.method]) continue;

    const operation = {
      tags: [entry.tag],
      summary: methodSummary(entry.method, entry.fullPath),
      responses: {
        200: {
          description: 'Sucesso',
        },
      },
    };

    if (entry.method === 'get' && isSearchEndpoint(entry.fullPath)) {
      operation.parameters = [
        {
          name: 'nome',
          in: 'query',
          required: true,
          schema: { type: 'string' },
          description: 'Termo de busca por nome.',
        },
      ];
      operation.responses[400] = {
        description: 'Parametro nome nao informado',
      };
    }

    spec.paths[entry.fullPath][entry.method] = operation;
  }
};

const buildOpenApiSpec = (baseSpec) => {
  const spec = JSON.parse(JSON.stringify(baseSpec));
  const routeEntries = readRouteEntries();

  ensureTags(spec, routeEntries);
  ensurePaths(spec, routeEntries);

  return spec;
};

module.exports = {
  buildOpenApiSpec,
};
