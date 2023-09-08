import app, { init, close } from '@/app';
import { TicketStatus } from '@prisma/client';
import faker from '@faker-js/faker';
import httpStatus from 'http-status';
import * as jwt from 'jsonwebtoken';
import supertest from 'supertest';
import {
  createEnrollmentWithAddress,
  createUser,
  createTicket,
  createPayment,
  createTicketTypeWithHotel,
} from '../factories';
import { cleanDb, generateValidToken } from '../helpers';
import {
  createActivity,
  createActivitiesWithDate,
  createSubscription,
  createLocation,
} from '../factories/activity-factory';
import { prisma } from '@/config';

beforeAll(async () => {
  await init();
  await cleanDb();
});

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await close();
});

const server = supertest(app);

describe('POST /activities/subscription', () => {
  it('should respond with status 401 if no token is given', async () => {
    const response = await server.post('/activities/subscription');

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word();

    const response = await server.post('/activities/subscription').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if there is no session for given token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.post('/activities/subscription').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
    it('should respond with status 400 when body is not given', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      const response = await server.post('/activities/subscription').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.BAD_REQUEST);
    });

    it('should respond with status 400 when body is not valid', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const invalidBody = { [faker.lorem.word()]: faker.lorem.word() };

      const response = await server
        .post('/activities/subscription')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidBody);

      expect(response.status).toBe(httpStatus.BAD_REQUEST);
    });

    it('should respond with status 403 when user has no enrollment', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const location = await createLocation();
      const activity = await createActivity(location.id);
      const body = { activityId: activity.id };

      const response = await server.post('/activities/subscription').set('Authorization', `Bearer ${token}`).send(body);

      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it("should respond with status 403 when ticket it's invalid", async () => {
      const user = await createUser();
      const enrollment = await createEnrollmentWithAddress(user);
      const token = await generateValidToken(user);
      const ticketType = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
      const location = await createLocation();
      const activity = await createActivity(location.id);
      const body = { activityId: activity.id };

      const response = await server.post('/activities/subscription').set('Authorization', `Bearer ${token}`).send(body);

      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it('should respond with status 400 when activity is invalid', async () => {
      const user = await createUser();
      const enrollment = await createEnrollmentWithAddress(user);
      const token = await generateValidToken(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      const location = await createLocation();
      await createActivity(location.id);
      const body = { activityId: -1 };

      const response = await server.post('/activities/subscription').set('Authorization', `Bearer ${token}`).send(body);

      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it("should respond with status 403 when there's activity time conflict", async () => {
      const user = await createUser();
      const enrollment = await createEnrollmentWithAddress(user);
      const token = await generateValidToken(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      const firstLocation = await createLocation();
      const secondLocation = await createLocation();
      const date = faker.date.between('2023-01-06T00:00:00.000Z', '2023-01-08T00:00:00.000Z');
      const firstActivity = await createActivitiesWithDate(firstLocation.id, date, '09:00', '12:00');
      const secondActivity = await createActivitiesWithDate(secondLocation.id, date, '10:00', '12:00');
      await createSubscription(firstActivity.id, ticket.id);
      const body = { activityId: secondActivity.id };

      const response = await server.post('/activities/subscription').set('Authorization', `Bearer ${token}`).send(body);

      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it('should respond with status 200 and subscription id when there is a valid body and user has a valid ticket', async () => {
      const user = await createUser();
      const enrollment = await createEnrollmentWithAddress(user);
      const token = await generateValidToken(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      const location = await createLocation();
      const activity = await createActivity(location.id);
      const body = { activityId: activity.id };

      const response = await server.post('/activities/subscription').set('Authorization', `Bearer ${token}`).send(body);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual({
        subscriptionId: expect.any(Number),
      });
    });
  });
});

describe('DELETE /activities/:activityId', () => {
  it('should respond with status 401 if no token is given', async () => {
    const response = await server.delete('/activities/1');

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word();

    const response = await server.delete('/activities/1').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if there is no session for given token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.delete('/activities/1').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
    it('should respond with status 400 when acticityId is not valid', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      const response = await server.delete('/activities/notvalid').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.BAD_REQUEST);
    });

    it('should respond with status 403 when user has no enrollment', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const location = await createLocation();
      const activity = await createActivity(location.id);

      const response = await server.delete(`/activities/${activity.id}`).set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it('should respond with status 403 when user is not subscribed to activity', async () => {
      const user = await createUser();
      const userUnsubscribing = await createUser();
      const enrollment = await createEnrollmentWithAddress(user);
      const token = await generateValidToken(userUnsubscribing);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      const location = await createLocation();
      const activity = await createActivity(location.id);
      await prisma.activitySubscription.deleteMany({});
      await createSubscription(activity.id, ticket.id);

      const response = await server.delete(`/activities/${activity.id}`).set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it('should respond with status 202 and unsubscribe from activity', async () => {
      const user = await createUser();
      const enrollment = await createEnrollmentWithAddress(user);
      const token = await generateValidToken(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      const location = await createLocation();
      const activity = await createActivity(location.id);
      await createSubscription(activity.id, ticket.id);

      const beforeCount = await prisma.activitySubscription.count();

      const response = await server.delete(`/activities/${activity.id}`).set('Authorization', `Bearer ${token}`);

      const afterCount = await prisma.activitySubscription.count();

      expect(beforeCount).toEqual(1);
      expect(afterCount).toEqual(0);

      expect(response.status).toBe(httpStatus.ACCEPTED);
    });
  });
});

describe('GET /activities/:activityId', () => {
  it('should respond with status 401 if no token is given', async () => {
    const response = await server.get('/activities/1');

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word();

    const response = await server.get('/activities/1').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if there is no session for given token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get('/activities/1').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
    it('should respond with status 400 when activity is not valid', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      const response = await server.get('/activities/-1').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it('should respond with status 202 and unsubscribe from activity', async () => {
      const user = await createUser();
      const enrollment = await createEnrollmentWithAddress(user);
      const token = await generateValidToken(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);
      const location = await createLocation();
      const activity = await createActivity(location.id);
      const subscription = await createSubscription(activity.id, ticket.id);

      const response = await server.get(`/activities/${activity.id}`).set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.OK);

      expect(response.body).toEqual(subscription);
    });
  });
});

describe('GET /activities/', () => {
  it('should respond with status 401 if no token is given', async () => {
    const response = await server.get('/activities/');

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word();

    const response = await server.get('/activities/').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if there is no session for given token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get('/activities/').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
    it('should respond with status 200 and an empty array when there is no activities', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      const response = await server.get('/activities/').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual([]);
    });

    it('should respond with status 200 and a list of days of activities', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const location = await createLocation();
      const activity = await createActivity(location.id);
      const date = activity.date.toISOString();

      const response = await server.get('/activities/').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual([date]);
    });
  });
});

describe('GET /activities/days/:date', () => {
  it('should respond with status 401 if no token is given', async () => {
    const response = await server.get('/activities/days/2022-02-02');

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word();

    const response = await server.get('/activities/days/2022-02-02').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if there is no session for given token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get('/activities/days/2022-02-02').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
    it('should respond with status 200 and an empty array when there is no activities', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const location = await createLocation();

      const response = await server.get('/activities/days/2022-02-02').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual([
        {
          id: location.id,
          name: location.name,
          Activities: [],
        },
      ]);
    });

    it('should respond with status 200 and a list of activities per day', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const location = await createLocation();
      const activity = await createActivity(location.id);
      const date = activity.date.toISOString().slice(0, 10);
      const newdate = activity.date.toISOString();

      const formattedStartsAt = activity.startsAt.toISOString();
      const formattedEndsAt = activity.endsAt.toISOString();

      const response = await server.get(`/activities/days/${date}`).set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual([
        {
          id: location.id,
          name: location.name,
          Activities: [
            {
              id: activity.id,
              name: activity.name,
              date: newdate,
              startsAt: formattedStartsAt,
              endsAt: formattedEndsAt,
              vacancy: activity.vacancy,
              location: activity.location,
              ActivitySubscription: [],
            },
          ],
        },
      ]);
    });
  });
});
