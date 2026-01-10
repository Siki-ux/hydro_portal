
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import axios from "axios"

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
                        return {
                            id: "1", // Placeholder
                            name: credentials.username as string,
                            email: "",
                            accessToken: response.data.access_token,
                        }
                    }

                    return null
                } catch (error: any) {
                    console.error("Auth error:", error.response?.data || error.message)
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
