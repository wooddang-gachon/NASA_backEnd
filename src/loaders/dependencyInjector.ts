import { Container } from "typedi";
import LoggerInstance from "./logger";
import config from "@/config";

export default () => {
  try {
    // Here you can register your services into the container
    // Example: Container.set('MyService', new MyService());
    LoggerInstance.info("Dependency Injector loaded successfully");
  } catch (e) {
    LoggerInstance.error("Error during dependency injection", e);
    throw e;
  }
};
