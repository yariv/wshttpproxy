import { createApplicationHandler } from "../../apiHandlers/createApplication";
import { createNextHandler } from "../../typedApi/nextAdapter";

export default createNextHandler(createApplicationHandler);
