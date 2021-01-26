import { createApplicationHandler } from "../../apiHandlers/createApplication";
import { createRouteHandler } from "../../apiHandlers/createRoute";
import { createNextHandler } from "../../typedApi/nextServer";

export default createNextHandler(createRouteHandler);
