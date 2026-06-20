export type ChangeType = "breaking" | "non-breaking" | "additive";

export interface ContractChange {
  type: ChangeType;
  message: string;
  path?: string;
  method?: string;
  field?: string;
}

export interface ContractDiff {
  breaking: ContractChange[];
  nonBreaking: ContractChange[];
  additive: ContractChange[];
}

type JsonSchema = Record<string, unknown>;
type Endpoint = {
  method?: string;
  path?: string;
  requestSchema?: JsonSchema;
  responseSchema?: JsonSchema;
  querySchema?: JsonSchema;
  statusCodes?: number[];
  description?: string;
};
type ContractLike = { endpoints?: Endpoint[] };

export function diffContracts(oldContract: unknown, nextContract: unknown): ContractDiff {
  const report: ContractDiff = { breaking: [], nonBreaking: [], additive: [] };
  const oldEndpoints = endpointsOf(oldContract);
  const nextEndpoints = endpointsOf(nextContract);
  const oldMap = new Map(oldEndpoints.map((endpoint) => [endpointKey(endpoint), endpoint]));
  const nextMap = new Map(nextEndpoints.map((endpoint) => [endpointKey(endpoint), endpoint]));

  for (const [key, endpoint] of oldMap) {
    if (!nextMap.has(key)) {
      report.breaking.push(change("breaking", `Endpoint ${key.replace(":", " ")} was removed`, endpoint));
    }
  }

  for (const [key, endpoint] of nextMap) {
    if (!oldMap.has(key)) {
      report.nonBreaking.push(change("non-breaking", `Endpoint ${key.replace(":", " ")} was added`, endpoint));
    }
  }

  for (const [key, oldEndpoint] of oldMap) {
    const nextEndpoint = nextMap.get(key);
    if (!nextEndpoint) continue;
    const changes = [
      ...classifySchemaChanges(oldEndpoint.requestSchema, nextEndpoint.requestSchema, "request", "body"),
      ...classifySchemaChanges(oldEndpoint.responseSchema, nextEndpoint.responseSchema, "response", "response"),
      ...classifySchemaChanges(oldEndpoint.querySchema, nextEndpoint.querySchema, "request", "query"),
    ];
    const oldCodes = new Set(oldEndpoint.statusCodes ?? []);
    const nextCodes = new Set(nextEndpoint.statusCodes ?? []);
    for (const code of oldCodes) {
      if (!nextCodes.has(code)) changes.push({ type: "breaking", message: `Status code ${code} was removed`, field: `statusCode.${code}` });
    }
    for (const code of nextCodes) {
      if (!oldCodes.has(code)) changes.push({ type: "non-breaking", message: `Status code ${code} was added`, field: `statusCode.${code}` });
    }
    if (oldEndpoint.description !== nextEndpoint.description && nextEndpoint.description) {
      changes.push({ type: "additive", message: "Description updated", field: "description" });
    }
    for (const item of changes) {
      report[item.type === "non-breaking" ? "nonBreaking" : item.type].push({
        ...item,
        path: oldEndpoint.path,
        method: oldEndpoint.method,
      });
    }
  }

  return report;
}

function endpointsOf(value: unknown): Endpoint[] {
  if (!value || typeof value !== "object") return [];
  const endpoints = (value as ContractLike).endpoints;
  return Array.isArray(endpoints) ? endpoints : [];
}

function endpointKey(endpoint: Endpoint): string {
  return `${endpoint.method ?? "GET"}:${endpoint.path ?? "/"}`;
}

function change(type: ChangeType, message: string, endpoint: Endpoint): ContractChange {
  return { type, message, path: endpoint.path, method: endpoint.method };
}

function classifySchemaChanges(
  oldSchema: JsonSchema | undefined,
  nextSchema: JsonSchema | undefined,
  side: "request" | "response",
  prefix: string,
): ContractChange[] {
  if (!oldSchema && !nextSchema) return [];
  if (!oldSchema && nextSchema) {
    return [{ type: side === "response" ? "non-breaking" : "additive", message: `${prefix} schema added`, field: prefix }];
  }
  if (oldSchema && !nextSchema) {
    return [{ type: "breaking", message: `${prefix} schema removed`, field: prefix }];
  }

  const changes: ContractChange[] = [];
  const oldProps = (oldSchema?.properties ?? {}) as Record<string, JsonSchema>;
  const nextProps = (nextSchema?.properties ?? {}) as Record<string, JsonSchema>;
  const oldRequired = (oldSchema?.required ?? []) as string[];
  const nextRequired = (nextSchema?.required ?? []) as string[];

  for (const [key, oldField] of Object.entries(oldProps)) {
    const fieldPath = `${prefix}.${key}`;
    const nextField = nextProps[key];
    if (!nextField) {
      changes.push({ type: "breaking", message: `Field "${fieldPath}" was removed`, field: fieldPath });
      continue;
    }
    const oldType = oldField.type;
    const nextType = nextField.type;
    if (oldType && nextType && oldType !== nextType) {
      changes.push({
        type: oldType === "unknown" ? "non-breaking" : "breaking",
        message: `Field "${fieldPath}" type changed from ${String(oldType)} to ${String(nextType)}`,
        field: fieldPath,
      });
    } else if (oldType === "object" && nextType === "object") {
      changes.push(...classifySchemaChanges(oldField, nextField, side, fieldPath));
    } else if (oldType === "array" && nextType === "array") {
      const oldItems = oldField.items as JsonSchema | undefined;
      const nextItems = nextField.items as JsonSchema | undefined;
      if (oldItems && nextItems) changes.push(...classifySchemaChanges(oldItems, nextItems, side, `${fieldPath}.items`));
    }
  }

  for (const key of Object.keys(nextProps)) {
    if (key in oldProps) continue;
    const fieldPath = `${prefix}.${key}`;
    changes.push({
      type: side === "request" && nextRequired.includes(key) ? "breaking" : "non-breaking",
      message: side === "request" && nextRequired.includes(key)
        ? `Required field "${fieldPath}" was added to request body`
        : `Field "${fieldPath}" was added`,
      field: fieldPath,
    });
  }

  for (const key of nextRequired) {
    if (key in oldProps && !oldRequired.includes(key)) {
      const fieldPath = `${prefix}.${key}`;
      changes.push({
        type: side === "request" ? "breaking" : "non-breaking",
        message: side === "request"
          ? `Field "${fieldPath}" changed from optional to required in request body`
          : `Field "${fieldPath}" is now required in response`,
        field: fieldPath,
      });
    }
  }
  return changes;
}
