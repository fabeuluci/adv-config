import * as fs from "fs";
import * as NodePath from "path";
import { Logger } from "adv-log";

export class ConfigLoader {
    
    constructor(
        private logger: Logger
    ) {
    }
    
    loadConfigFromArgv<T>(values: T): T {
        const configFilePath = this.detectConfigFilePathFromArgv();
        return this.applyConfigFile(values, configFilePath);
    }
    
    detectConfigFilePathFromArgv() {
        return process.argv.length < 3 || !process.argv[2] ? NodePath.resolve(__dirname, "../../../conf/config.json") : NodePath.resolve(process.argv[2]);
    }
    
    applyConfigFile<T>(values: T, configPath: string): T {
        try {
            if (fs.existsSync(configPath)) {
                this.logger.debug("Reading config file '" + configPath + "'");
                let cfgContent = fs.readFileSync(configPath, "utf8");
                let cfg = JSON.parse(cfgContent);
                if (typeof(cfg) != "object" || cfg == null) {
                    throw new Error("Config expected to be an object");
                }
                values = this.overwriteOptions(values, cfg);
            }
            else {
                this.logger.debug("No config file");
            }
            return values;
        }
        catch (e) {
            this.logger.error("Cannot read config file " + configPath, e);
            throw e;
        }
    }
    
    overwriteOptions<T = any>(target: T, source: T): T {
        if (typeof(target) != "object" || target == null) {
            return source;
        }
        if (typeof(source) != "object") {
            throw new Error("Cannot overwrite object with primitive type");
        }
        if (Array.isArray(target)) {
            if (!Array.isArray(source)) {
                throw new Error("Cannot mix array with object");
            }
            return source;
        }
        for (const key in source) {
            try {
                target[key] = this.overwriteOptions(target[key], source[key]);
            }
            catch (e) {
                throw new Error("OverwriteOptions " + key + ": " + (e && (<{message: string}>e).message ? (<{message: string}>e).message : ""));
            }
        }
        return target;
    }
}
