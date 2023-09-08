import { prisma } from "../../config";
import { GitHubParamsForAccessToken } from "../../services";
import { Prisma } from "@prisma/client";
import axios from "axios";

async function create(data: Prisma.SessionUncheckedCreateInput) {
  return prisma.session.create({
    data,
  });
}

async function createCodeForAccessTokenGit(params: GitHubParamsForAccessToken, GITHUB_ACCESS_TOKEN_URL: string) {
  const { data } = await axios.post(GITHUB_ACCESS_TOKEN_URL, params, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return data;
}

async function getUsername(token: string, GITHUB_USER_URL: string) {
  const response = await axios.get(GITHUB_USER_URL, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response;
}

const sessionRepository = {
  create,
  createCodeForAccessTokenGit,
  getUsername
};

export default sessionRepository;
