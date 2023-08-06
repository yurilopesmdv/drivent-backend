import faker from '@faker-js/faker';
import { prisma } from '@/config';

export async function createActivity(locationId: number) {
  const startsAt = new Date();
  startsAt.setHours(9, 0, 0, 0);

  const endsAt = new Date(startsAt);
  endsAt.setHours(startsAt.getHours() + 1);

  return await prisma.activities.create({
    data: {
      name: faker.name.findName(),
      date: faker.date.future(),
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      vacancy: 30,
      location: locationId,
    },
  });
}

export async function createActivitiesWithDate(locationId: number, date: Date, startsAt: string, endsAt: string) {
  const formattedStartsAt = new Date(`2023-08-01T${startsAt}:00`);
  const formattedEndsAt = new Date(`2023-08-03T${endsAt}:00`);

  return await prisma.activities.create({
    data: {
      name: faker.name.findName(),
      date: date,
      startsAt: formattedStartsAt.toISOString(),
      endsAt: formattedEndsAt.toISOString(),
      vacancy: 30,
      location: locationId,
    },
  });
}

export async function createLocation() {
  return await prisma.activitiesLocation.create({
    data: {
      name: faker.name.findName(),
    },
  });
}

export async function createSubscription(activityId: number, ticketId: number) {
  return await prisma.activitySubscription.create({
    data: {
      activityId: activityId,
      ticketId: ticketId,
    },
  });
}
