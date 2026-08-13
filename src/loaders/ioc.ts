import { Container } from 'typedi';
import { IocContainer } from '@tsoa/runtime';

export const iocContainer: IocContainer = {
  get: <T>(controller: any): T => {
    return Container.get<T>(controller);
  },
};
