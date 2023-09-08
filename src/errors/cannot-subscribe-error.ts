import { ApplicationError } from '../protocols';

export function cannotSubscribeError(): ApplicationError {
  return {
    name: 'CannotSubscribeError',
    message: 'Cannot subscribe to this activity!',
  };
}
