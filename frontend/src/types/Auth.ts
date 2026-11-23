/** GET /auth/me: the logged-in user. displayName is the current GitHub name, or the username */
export interface CurrentUser {
  username: string;
  displayName: string;
}

/** GET /auth/config: which ways to log in the server offers */
export interface LoginOptions {
  passwordLogin: boolean;
  github: boolean;
}
