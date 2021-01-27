import { createApplicationHandler } from "../../apiHandlers/createApplication";
import { createRouteHandler } from "../../apiHandlers/createRoute";
import { createNextHandler } from "../../typedApi/nextAdapter";

export default createNextHandler(createRouteHandler);
