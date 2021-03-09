# Introduction

TypedApi is a TypeScript library that facilitates write API clients and servers that share the same schema. It provides the following benefits:

1. Compile-time type checking of both client and server code to ensure it adheres to the schema.
2. Integrated validation via Zod [TODO link].
3. Zero code generation.
4. Easy integration into any backend framework. Currently, Koa and NextJS are supported.

# Example

TypedApi Schemas are described as objects containing a list of methods, each of which has a request and a response type. Both request and response types are Zod types. The schema below describes a service with 2 methods:

1.  `sayHi`, which takes a `name` parameter and returns a string.
2.  `divide`, which takes two numbers and returns the result of dividing num1 by num2.

```typescript
import * as z from "zod";

export const testSchema = {
  sayHi: {
    req: z.object({
      name: z.string(),
    }),
    res: z.string(),
  },
  divide: {
    req: z.object({
      num1: z.number(),
      num2: z.number(),
    }),
    res: z.number(),
  },
};
```

The following code snippet shows a basic example of how to implement the two methods on the server side using Koa [ TODO link].

```typescript
import Koa from "koa";
import Router from "koa-router";
import { Server } from "net";
import { createKoaRoute } from "typedApi";
import { ApiHttpError } from "typedApi";

const pathPrefix = "/api";

const createServer = (port: number): Server => {
  const koa = new Koa();
  const apiRouter = new Router({
    prefix: pathPrefix,
  });

  createKoaRoute(apiRouter, testSchema, "divide", async ({ num1, num2 }) => {
    if (num2 === 0) {
      throw new ApiHttpError("Can't divide by 0", 400);
    }
    return num1 / num2;
  });

  createKoaRoute(apiRouter, testSchema, "sayHi", async ({ name }) => {
    return "Hi " + name;
  });

  koa.use(apiRouter.allowedMethods());
  koa.use(apiRouter.routes());
  return koa.listen(port);
};
```
