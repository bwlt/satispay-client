import { either as E, taskEither as TE } from "fp-ts";

const request = TE.tryCatchK(fetch, E.toError);

export type HttpClient = {
  request: typeof request;
};

export const httpClient: HttpClient = { request };
