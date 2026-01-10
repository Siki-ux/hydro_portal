
import NextAuth, { User } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import axios, { AxiosError } from "axios"

// Helper to decode JWT payload safely
function parseJwt(token: string) {
    try {
        return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    } catch (e) {
        return null;
    }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                try {
                    if (!credentials?.username || !credentials?.password) {
                        return null
                    }

                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

                    // Using URLSearchParams to send data as application/x-www-form-urlencoded
                    const params = new URLSearchParams();
                    params.append('username', credentials.username as string);
                    params.append('password', credentials.password as string);
                    params.append('grant_type', 'password'); // Required by OAuth2PasswordRequestForm

                    const response = await axios.post(`${apiUrl}/auth/token`, params, {
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                    })

                    if (response.data && response.data.access_token) {
                        const token = response.data.access_token;
                        const decoded = parseJwt(token);
                        // Use 'sub' from JWT as ID, fallback to '1' if missing (unlikely)
                        const userId = decoded?.sub || "1";

                        return {
                            id: userId,
                            name: credentials.username as string,
                            email: "",
                            accessToken: token,
                        }
                    }

                    return null
                } catch (error: unknown) {
                    let msg = "Auth error";
                    if (axios.isAxiosError(error)) {
                        msg = error.response?.data || error.message;
                    } else if (error instanceof Error) {
                        msg = error.message;
                    }
                    console.error("Auth error:", msg);
                    return null
                }
            }
        }),
    ],
    pages: {
        signIn: '/auth/signin',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.accessToken = (user as any).accessToken
            }
            return token
        },
        async session({ session, token }) {
            (session as any).accessToken = token.accessToken
            return session
        }
    }
})
