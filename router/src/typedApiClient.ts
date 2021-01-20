import { globalConfig } from "dev-in-prod-lib/src/globalConfig";
import { MethodType, ReqSchema, ResSchema } from "./apiSchema";

export const callApi = async (
  methodName: MethodType,
  body: ReqSchema<typeof methodName>
): Promise<ResSchema<typeof methodName>> => {
  const res = await fetch(globalConfig.routerUrl + "/api/" + methodName, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
  return await res.json();
};
