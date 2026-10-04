import type { ParamsDictionary } from "express-serve-static-core";

export function getParamId(params: ParamsDictionary): string {
  const id = params.id;

  if (typeof id !== "string" || id.length === 0) {
    throw new Error("ID parameter wajib diisi");
  }

  return id;
}
