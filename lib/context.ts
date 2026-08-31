import { AsyncLocalStorage } from "async_hooks";
import { v4 as uuidv4 } from "uuid";

interface RequestContext {
  correlationId: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getCorrelationId(): string | undefined {
  return requestContext.getStore()?.correlationId;
}

export function withContext<T>(
  context: Partial<RequestContext>,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const store = requestContext.getStore();
  return requestContext.run(
    { ...store, correlationId: context.correlationId || uuidv4() },
    fn
  );
}
