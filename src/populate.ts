import { init } from '@/app';
import { loadEnv } from '@/config';
import { PrismaClient, Prisma } from '@prisma/client';
import faker from '@faker-js/faker';
import {
  createTicket,
  createPayment,
  createTicketTypeWithHotel,
  createTicketTypeWithoutHotel,
  createTicketTypeRemote,
  createEnrollmentWithAddress,
} from '../tests/factories';

const prisma = new PrismaClient();

async function createActivityLocation(name: string) {
  const existingLocation = await prisma.activitiesLocation.findUnique({
    where: { name: name },
  });

  if (!existingLocation) {
    return prisma.activitiesLocation.create({
      data: {
        name: name,
      },
    });
  }

  return existingLocation;
}

async function createActivity(name: string, startsAt: string, endsAt: string, vacancy: number, location: number) {
  return prisma.activities.create({
    data: {
      name: name,
      startsAt: new Date(`2023-08-06T${startsAt}:00.000Z`),
      endsAt: new Date(`2023-08-06T${endsAt}:00.000Z`),
      vacancy: vacancy,
      location: location,
      date: faker.date.between('2023-08-01T09:00:00.000Z', '2023-08-30T18:00:00.000Z'),
    },
  });
}

async function createdata() {
  const ticketType = await createTicketTypeWithHotel();
  await createTicketTypeWithoutHotel();
  await createTicketTypeRemote();

  const enrollment1 = await createEnrollmentWithAddress();
  const enrollment2 = await createEnrollmentWithAddress();
  const enrollment3 = await createEnrollmentWithAddress();

  const ticket1 = await createTicket(enrollment1.id, ticketType.id, 'PAID');
  const ticket2 = await createTicket(enrollment2.id, ticketType.id, 'PAID');
  const ticket3 = await createTicket(enrollment3.id, ticketType.id, 'PAID');

  const payment1 = await createPayment(ticket1.id, ticketType.price);
  const payment2 = await createPayment(ticket2.id, ticketType.price);
  const payment3 = await createPayment(ticket3.id, ticketType.price);

  const location1 = await createActivityLocation('Auditório Principal');
  const location2 = await createActivityLocation('Auditório Lateral');
  const location3 = await createActivityLocation('Sala de Workshop');

  await createActivity('JavaScript', '09:00', '10:30', 27, location1.id);
  await createActivity('Docker e AWS', '10:00', '11:00', 10, location1.id);
  await createActivity('Clean Code', '11:00', '12:00', 10, location2.id);
  await createActivity('Palestra x', '09:00', '12:00', 5, location2.id);
  await createActivity('Palestra y', '13:00', '14:00', 0, location3.id);
  await createActivity('Palestra z', '14:00', '15:00', 0, location3.id);
}

loadEnv();
const port = +process.env.PORT || 4000;
init().then(() => {
  createdata();
});
