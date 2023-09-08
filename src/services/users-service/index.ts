import { cannotEnrollBeforeStartDateError } from "../../errors";
import userRepository from "../../repositories/user-repository";
import { User } from "@prisma/client";
import bcrypt from "bcrypt";
import eventsService from "../events-service";
import { duplicatedEmailError } from "./errors";

export async function createUser({ email, password }: CreateUserParams): Promise<User> {
  await canEnrollOrFail();

  const duplicated = await validateUniqueEmailOrFail(email);
  if(duplicated){
    throw duplicatedEmailError();
  }
  const passwordText: string = password.toString() as string;

  const hashedPassword = await bcrypt.hash(passwordText, 12);
  return userRepository.create({
    email,
    password: hashedPassword,
  });
}

async function validateUniqueEmailOrFail(email: string) {
  const userWithSameEmail = await userRepository.findByEmail(email);
  if (userWithSameEmail) {
    return userWithSameEmail;
  }
  return false;
}

async function canEnrollOrFail() {
  const canEnroll = await eventsService.isCurrentEventActive();
  if (!canEnroll) {
    throw cannotEnrollBeforeStartDateError();
  }
}

export type CreateUserParams = Pick<User, "email" | "password">;

const userService = {
  createUser,
  validateUniqueEmailOrFail
};

export * from "./errors";
export default userService;
