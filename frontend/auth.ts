import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET || '',
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, profile }) {
      if (profile && 'sub' in profile) {
        token.googleId = String(profile.sub);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { googleId?: string }).googleId = token.googleId as string | undefined;
      }
      return session;
    },
  },
});
