import LoggerInstance from "./logger";

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
