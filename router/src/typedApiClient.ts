import { globalConfig } from "dev-in-prod-lib/src/globalConfig";
import { apiSchema, MethodType, ReqSchema, ResSchema } from "./apiSchema";

type RespType<T> = {
  response: Response;
  parsedBody?: T;
  error?: any;
  status: number;
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
  if (res.status === 200) {
    const parsedBody = apiSchema[methodName].resSchema.parse(respBody);
    return {
      response: res,
      parsedBody: parsedBody,
      status: res.status,
    };
  }
  return {
    response: res,
    error: respBody.error,
    status: res.status,
  };
};

const log = (obj: any) => {
  const util = require("util");
  console.log(util.inspect(obj, { showHidden: false, depth: null }));
};
