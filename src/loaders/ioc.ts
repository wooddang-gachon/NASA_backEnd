import { Container } from "typedi";
import { IocContainer } from "@tsoa/runtime";

export const iocContainer: IocContainer = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get: <T>(controller: any): T => {
    return Container.get<T>(controller);
  },
};
