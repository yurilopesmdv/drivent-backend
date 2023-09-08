import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";

import { unauthorizedError } from "../errors";
import { prisma } from "../config";
import authenticationService from "../services/authentication-service";

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.header("Authorization");
  if (!authHeader) return generateUnauthorizedResponse(res);
  
  const token = authHeader.split(" ")[1];

  if (!token) return generateUnauthorizedResponse(res);
  try {
    if(token[0] == 'g' && token[1] == 'h' && token[2] == '0'){
      const userGitHub = await authenticationService.fetchUserFromGitHub(token);
      if(userGitHub){
        const { userId } = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;      
      }
    }    
    const session = await prisma.session.findFirst({
      where: {
        token,
      },
    });
    if (!session) return generateUnauthorizedResponse(res);
    req.userId = session.userId;
    return next();
  } catch (err) {
    console.log(err);
    return generateUnauthorizedResponse(res);
  }
}

function generateUnauthorizedResponse(res: Response) {
  res.status(httpStatus.UNAUTHORIZED).send(unauthorizedError());
}

export type AuthenticatedRequest = Request & JWTPayload;

type JWTPayload = {
  userId: number;
};
