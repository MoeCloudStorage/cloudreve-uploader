import {Options} from "./index";
import Logger from "../logger";

export default abstract class Base {
    protected options: Options
    protected logger: Logger
    protected abstract start():Promise<any>

    constructor(options: Options) {
        this.options = options
        this.logger = new Logger(options.logLevel)

        this.logger.info("options: ",options)
    }

    public pickFile(){
        const element = document.createElement("input")
        element.type = "file"

    }
}