import { readFile } from 'node:fs/promises';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const schema = JSON.parse(await readFile(new URL('../data/current-region-condition-packets.schema.json', import.meta.url), 'utf8'));
const data = JSON.parse(await readFile(new URL('../data/current-region-condition-packets.v0.1.json', import.meta.url), 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);
if (!validate(data)) {
  console.error(JSON.stringify(validate.errors, null, 2));
  process.exit(1);
}
console.log('Fishing condition packets passed Ajv JSON Schema 2020-12 validation.');
