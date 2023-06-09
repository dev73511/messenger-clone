import {withAuth} from 'next-auth/middleware';

/**
 * 
 * The code block is using the withAuth higher-order component (HOC) 
 * from next-auth/middleware to protect certain pages or routes 
 * that require authentication. In this case, 
 * the signIn property is set to '/', which means 
 * if a user tries to access a protected page 
 * without being authenticated, 
 * they will be redirected to the sign-in page ('/').
 * 
 */
export default withAuth({
    pages: {
        signIn: '/'
    }
});

/**
 * 
 * the code snippet includes a config object with a matcher array. 
 * The matcher array defines the routes that should be 
 * protected by the authentication middleware. In this case, 
 * any route that starts with "/users/" or "/conversations/" 
 * will be protected and require authentication.
 * 
 */
export const config = {
    matcher: [
        "/users/:path*",
        "/conversations/:path*"
    ]  
};