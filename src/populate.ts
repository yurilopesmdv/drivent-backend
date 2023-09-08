import { init } from '@/app';
import { loadEnv } from '@/config';
import { PrismaClient } from '@prisma/client';

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

async function createActivity(
  name: string,
  startsAt: string,
  endsAt: string,
  vacancy: number,
  location: number,
  date: string,
) {
  const activityDate = new Date(date);
  const [startHour, startMinute] = startsAt.split(':');
  const [endHour, endMinute] = endsAt.split(':');
  const activityStartsAt = new Date(activityDate);
  activityStartsAt.setHours(+startHour, +startMinute, 0, 0);
  const activityEndsAt = new Date(activityDate);
  activityEndsAt.setHours(+endHour, +endMinute, 0, 0);

  return prisma.activities.create({
    data: {
      name: name,
      startsAt: new Date(`2023-08-06T${startsAt}:00.000`),
      endsAt: new Date(`2023-08-06T${endsAt}:00.000`),
      vacancy: vacancy,
      location: location,
      date: activityDate,
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

  await createActivity('JavaScript', '09:00', '10:30', 27, location1.id, '2023-08-06');
  await createActivity('Docker e AWS', '09:30', '12:00', 10, location1.id, '2023-08-06');
  await createActivity('A Revolução do 5G', '14:00', '15:00', 10, location2.id, '2023-08-06');
  await createActivity('Internet das Coisas (IoT)', '13:00', '14:00', 0, location3.id, '2023-08-06');

  await createActivity('JavaScript', '09:00', '10:30', 27, location1.id, '2023-08-10');
  await createActivity('A Revolução do 5G', '14:00', '15:00', 10, location2.id, '2023-08-10');
  await createActivity('Automação Residencial', '09:00', '11:00', 5, location2.id, '2023-08-10');
  await createActivity('Cibersegurança em um Mundo Digital', '09:00', '12:00', 0, location3.id, '2023-08-10');

  await createActivity('Internet das Coisas (IoT)', '13:00', '14:00', 0, location3.id, '2023-08-20');
  await createActivity('Cibersegurança em um Mundo Digital', '09:00', '12:00', 0, location3.id, '2023-08-20');

  await createActivity('Docker e AWS', '12:30', '14:00', 10, location1.id, '2023-09-16');
  await createActivity('A Revolução do 5G', '14:00', '15:00', 10, location2.id, '2023-08-16');
  await createActivity('Internet das Coisas (IoT)', '12:00', '14:00', 0, location3.id, '2023-08-16');

  await createActivity('JavaScript', '09:00', '10:30', 27, location1.id, '2023-08-28');
  await createActivity('Docker e AWS', '09:30', '12:00', 10, location1.id, '2023-08-28');
  await createActivity('A Revolução do 5G', '14:00', '15:00', 10, location2.id, '2023-08-28');
  await createActivity('Internet das Coisas (IoT)', '13:00', '14:00', 0, location3.id, '2023-08-28');
}

loadEnv();
const port = +process.env.PORT || 4000;
init().then(() => {
  createdata();
  console.log('DB successfully populated!');
});
