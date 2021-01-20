import { globalConfig } from "dev-in-prod-lib/src/globalConfig";
import { apiSchema, MethodType, ReqSchema, ResSchema } from "./apiSchema";

type RespType<T> = Response & {
  parsedBody: T;
};

export const callApi = async (
  methodName: MethodType,
  reqBody: ReqSchema<typeof methodName>
): Promise<RespType<ResSchema<typeof methodName>>> => {
  const res = await fetch(globalConfig.routerUrl + "/api/" + methodName, {
    method: "POST",
    body: JSON.stringify(reqBody),
    headers: { "content-type": "application/json" },
  });
  const respBody = await res.json();

  const parsedBody = apiSchema[methodName].resSchema.parse(respBody);

  return {
    ...res,
    parsedBody: parsedBody,
  };
};
