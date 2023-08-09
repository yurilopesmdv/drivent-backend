import { prisma, redis } from '@/config';
import { Activities, ActivitySubscription } from '@prisma/client';

type CreateParams = Omit<ActivitySubscription, 'id'>;

async function findByActivityId(activityId: number) {
  return prisma.activities.findFirst({
    where: {
      id: activityId,
    },
  });
}

async function create(
  { activityId, ticketId }: CreateParams,
  vacancy: number,
): Promise<[ActivitySubscription, Activities]> {
  const subscription = await prisma.activitySubscription.create({
    data: {
      activityId,
      ticketId,
    },
  });

  const activity = await prisma.activities.update({
    where: {
      id: activityId,
    },
    data: {
      vacancy: vacancy - 1,
    },
  });

  redis.set(`activity:${activityId}`, JSON.stringify(activity));

  return [subscription, activity];
}

async function findByTicketAndActivityId(activityId: number, ticketId: number) {
  return prisma.activitySubscription.findFirst({
    where: {
      activityId: activityId,
      ticketId: ticketId,
    },
  });
}

async function findDays() {
  return prisma.activities.groupBy({
    by: ['date'],
    orderBy: {
      date: 'asc',
    },
  });
}

async function findActivitiesByDay(date: Date) {
  const plus1day = new Date(date);
  plus1day.setDate(plus1day.getDate() + 1);

  const today = new Date(date);
  today.setDate(today.getDate() - 1);

  return prisma.activitiesLocation.findMany({
    include: {
      Activities: {
        where: {
          date: {
            gte: today,
            lt: plus1day,
          },
        },
        orderBy: {
          startsAt: 'asc',
        },
        include: {
          ActivitySubscription: true,
        },
      },
    },
  });
}

async function findByActivityDateAndTicket(
  date: Date,
  ticketId: number,
): Promise<{ startsAt: string; endsAt: string }[]> {
  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);

  const cachedData = await redis.get(`activityData:${startDate}:${endDate}:${ticketId}`);
  if (cachedData) {
    return JSON.parse(cachedData) as { startsAt: string; endsAt: string }[];
  }

  const data = await prisma.$queryRaw`
    SELECT
      "Activities"."startsAt" as "startsAt",
      "Activities"."endsAt" as "endsAt"
    FROM "ActivitySubscription"
    JOIN "Activities" ON "ActivitySubscription"."activityId" = "Activities"."id"
    WHERE "Activities".date >= ${startDate} AND "Activities".date < ${endDate}
      AND "ActivitySubscription"."ticketId" = ${ticketId};
  `;

  redis.set(`activityData:${startDate}:${endDate}:${ticketId}`, JSON.stringify(data));

  return data as { startsAt: string; endsAt: string }[];
}

async function deleteSubscription(SubscriptionId: number, vacancy: number, activityId: number) {
  await prisma.activitySubscription.delete({
    where: {
      id: SubscriptionId,
    },
  });

  const updatedActivity = await prisma.activities.update({
    where: {
      id: activityId,
    },
    data: {
      vacancy: vacancy + 1,
    },
  });

  redis.set(`activity:${activityId}`, JSON.stringify(updatedActivity));

  return updatedActivity;
}

const activitiesRepository = {
  create,
  findByActivityId,
  findByTicketAndActivityId,
  findDays,
  findActivitiesByDay,
  findByActivityDateAndTicket,
  deleteSubscription,
};

export default activitiesRepository;
