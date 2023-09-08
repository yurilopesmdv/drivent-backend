import sessionRepository from "../../repositories/session-repository";
import userRepository from "../../repositories/user-repository";
import { exclude } from "../../utils/prisma-utils";
import { User } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { invalidCredentialsError } from "./errors";
import qs from "querystring";
import userService from "../users-service";


export async function singInGit(code: string) {
  const token = await exchangeCodeForAccessToken(code);
  const user = await fetchUserFromGitHub(token);
  const duplicated = await userService.validateUniqueEmailOrFail(user.email !== null ? user.email : user.login);
  if(duplicated){
    await sessionRepository.create({
      token,
      userId: duplicated.id,
    });
    return {
      user: {
        email: duplicated.email,
        id: duplicated.id
      },
      token,
    };
  }
  const creatUser = await userService.createUser({email: user.email !== null ? user.email : user.login, password: user.id});
  await sessionRepository.create({
    token,
    userId: creatUser.id,
  });
  return {
    user: {
      email: creatUser.email, 
      id: creatUser.id
    },
    token,
  };
}

export type GitHubParamsForAccessToken = {
  code: string;
  grant_type: string;
  redirect_uri: string;
  client_id: string;
  client_secret: string;
}

async function exchangeCodeForAccessToken(code: string) {
  const GITHUB_ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token";

  const { REDIRECT_URL, CLIENT_ID, CLIENT_SECRET } = process.env;
  const params: GitHubParamsForAccessToken = {
    code,
    grant_type: "authorization_code",
    redirect_uri: REDIRECT_URL,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET
  }

  const data: any = await sessionRepository.createCodeForAccessTokenGit(params, GITHUB_ACCESS_TOKEN_URL)

  const { access_token } = qs.parse(data);
  return Array.isArray(access_token) ? access_token.join("") : access_token;
}

export async function fetchUserFromGitHub(token: string) {
  const GITHUB_USER_URL = "https://api.github.com/user";
  
  const response: any = await sessionRepository.getUsername(token, GITHUB_USER_URL);
  return response.data;
}

async function signIn(params: SignInParams): Promise<SignInResult> {
  const { email, password } = params;

  const user = await getUserOrFail(email);

  await validatePasswordOrFail(password, user.password);

  const token = await createSession(user.id);

  return {
    user: exclude(user, "password"),
    token,
  };
}

async function getUserOrFail(email: string): Promise<GetUserOrFailResult> {
  const user = await userRepository.findByEmail(email, { id: true, email: true, password: true });
  if (!user) throw invalidCredentialsError();

  return user;
}

async function createSession(userId: number) {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET);
  await sessionRepository.create({
    token,
    userId,
  });

  return token;
}

async function validatePasswordOrFail(password: string, userPassword: string) {
  const isPasswordValid = await bcrypt.compare(password, userPassword);
  if (!isPasswordValid) throw invalidCredentialsError();
}

export type SignInParams = Pick<User, "email" | "password">;

type SignInResult = {
  user: Pick<User, "id" | "email">;
  token: string;
};

type GetUserOrFailResult = Pick<User, "id" | "email" | "password">;

const authenticationService = {
  signIn,
  singInGit,
  fetchUserFromGitHub
};

export default authenticationService;
export * from "./errors";
