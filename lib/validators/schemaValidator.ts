/* AUTO-GENERATED FILE — Syndicate Schema Validator */

import Ajv from "ajv";
import { schemas } from "../../schemas/compiledSchemas";

const ajv = new Ajv({ allErrors: true });

export function validateAgainstSchema(
  schemaId: string,
  data: any
): { valid: boolean; errors?: any[] } {
  const schema = schemas[schemaId as keyof typeof schemas];
  if (!schema) {
    return {
      valid: false,
      errors: [{ message: `Schema '${schemaId}' not found.` }]
    };
  }

  const validate = ajv.compile(schema);
  const valid = validate(data) as boolean;
  return { valid, errors: validate.errors || [] };
}