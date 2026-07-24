const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const OPENAPI_DIR = path.join(__dirname, 'openapi');
const PATHS_DIR = path.join(OPENAPI_DIR, 'paths');

function mergeSpecSection(target, source, key) {
  if (!source[key]) {
    return;
  }

  target[key] = {
    ...(target[key] || {}),
    ...source[key],
  };
}

function loadYaml(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return yaml.load(fileContent) || {};
}

function getOpenApiSpec() {
  const baseSpecPath = path.join(OPENAPI_DIR, 'base.yaml');
  const baseSpec = loadYaml(baseSpecPath);

  const spec = {
    ...baseSpec,
    paths: { ...(baseSpec.paths || {}) },
    tags: [...(baseSpec.tags || [])],
    components: {
      ...(baseSpec.components || {}),
      schemas: { ...((baseSpec.components && baseSpec.components.schemas) || {}) },
      parameters: { ...((baseSpec.components && baseSpec.components.parameters) || {}) },
      responses: { ...((baseSpec.components && baseSpec.components.responses) || {}) },
      securitySchemes: { ...((baseSpec.components && baseSpec.components.securitySchemes) || {}) },
    },
  };

  const pathFiles = fs
    .readdirSync(PATHS_DIR)
    .filter((fileName) => fileName.endsWith('.yaml') || fileName.endsWith('.yml'))
    .sort();

  for (const fileName of pathFiles) {
    const filePath = path.join(PATHS_DIR, fileName);
    const fileSpec = loadYaml(filePath);

    mergeSpecSection(spec, fileSpec, 'paths');

    if (fileSpec.tags && Array.isArray(fileSpec.tags) && fileSpec.tags.length > 0) {
      const existing = new Set(spec.tags.map((tag) => tag.name));
      for (const tag of fileSpec.tags) {
        if (tag && tag.name && !existing.has(tag.name)) {
          spec.tags.push(tag);
          existing.add(tag.name);
        }
      }
    }

    if (fileSpec.components) {
      mergeSpecSection(spec.components, fileSpec.components, 'schemas');
      mergeSpecSection(spec.components, fileSpec.components, 'parameters');
      mergeSpecSection(spec.components, fileSpec.components, 'responses');
      mergeSpecSection(spec.components, fileSpec.components, 'securitySchemes');
    }
  }

  return spec;
}

module.exports = {
  getOpenApiSpec,
};
