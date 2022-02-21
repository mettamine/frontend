import * as TE from 'fp-ts/lib/TaskEither';
import * as E from "fp-ts/lib/Either";
import { pipe } from 'fp-ts/lib/function';

export type Response<T> = E.Either<Error, T>;

export const get = async (path: string, params: Object) => pipe(
  TE.tryCatch(
    () => fetch(`http://161.35.73.100:8888/${path}`, {
      method: 'post',
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(params),
    }).then(res => res.json()),
    (reason) => new Error(`${reason}`)
  ),
  TE.map((resp) => resp),
)();
