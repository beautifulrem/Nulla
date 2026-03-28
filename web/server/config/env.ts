import { getPublicEnv, getServerEnv, type PublicEnv, type ServerEnv } from "@/lib/env";

export function loadServerEnv(): ServerEnv {
  return getServerEnv();
}

export function loadPublicEnv(): PublicEnv {
  return getPublicEnv();
}
