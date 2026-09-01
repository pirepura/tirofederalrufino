import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    rol: string;
    socioId: string | null;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      rol: string;
      socioId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    rol?: string;
    socioId?: string | null;
  }
}
