import { createApplicationHandler } from "../../apiHandlers/createApplication";
import { createNextHandler } from "../../typedApi/nextServer";

export default createNextHandler(createApplicationHandler);
