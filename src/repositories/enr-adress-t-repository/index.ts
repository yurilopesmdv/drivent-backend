import { prisma } from "../../config/database";
import { Address, Enrollment, Prisma } from "@prisma/client";
import enrollmentRepository from "../enrollment-repository/index";
import addressRepository from "../address-repository/index";

export type CreateEnrollmentParams = Omit<Enrollment, "id" | "createdAt" | "updatedAt">;
export type UpdateEnrollmentParams = Omit<CreateEnrollmentParams, "userId">;
export type CreateAddressParams = Omit<Address, "id" | "createdAt" | "updatedAt" | "enrollmentId">;
export type UpdateAddressParams = CreateAddressParams;

async function upsertEnrollmentAndAdress(
  userId: number,
  createdEnrollment: CreateEnrollmentParams,
  updatedEnrollment: UpdateEnrollmentParams,
  createdAddress: CreateAddressParams,
  updatedAddress: UpdateAddressParams
) {
  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const enrollment = await enrollmentRepository.upsert(userId, createdEnrollment, updatedEnrollment, tx);
      await addressRepository.upsert(enrollment.id, createdAddress, updatedAddress, tx);
    });
  } catch (error) {
    throw new Error();
  }
}

const enrAdressRepository = {
  upsertEnrollmentAndAdress
};

export default enrAdressRepository;

