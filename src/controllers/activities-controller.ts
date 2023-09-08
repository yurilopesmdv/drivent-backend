import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares';
import httpStatus from 'http-status';
import activitiesService from '../services/activities-service';
import ticketService from '../services/tickets-service';

export async function activitySubscription(req: AuthenticatedRequest, res: Response) {
  try {
    const { userId } = req;
    const { activityId } = req.body;
    if (!activityId) {
      return res.sendStatus(httpStatus.BAD_REQUEST);
    }
    const [subscription] = await activitiesService.createSubscription(userId, Number(activityId));
    return res.status(httpStatus.OK).send({ subscriptionId: subscription.id });
  } catch (error) {
    if (error.name === 'CannotSubscribeError') {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }
    return res.sendStatus(httpStatus.NOT_FOUND);
  }
}

export async function userHasSubscripted(req: AuthenticatedRequest, res: Response) {
  try {
    const { userId } = req;
    const { activityId } = req.params;
    const ticket = await ticketService.getTicketByUserId(userId);
    const activitie = await activitiesService.findSubscriptionByTicketAndActivityIds(Number(activityId), ticket.id);
    if (!activitie) {
      return res.sendStatus(httpStatus.NOT_FOUND);
    } else {
      return res.status(httpStatus.OK).send(activitie);
    }
  } catch (error) {
    return res.sendStatus(httpStatus.NOT_FOUND);
  }
}

export async function getDays(req: AuthenticatedRequest, res: Response) {
  try {
    const days = await activitiesService.getDays();
    const ActivitiesDay = days.map((item) => item.date);
    return res.status(httpStatus.OK).send(ActivitiesDay);
  } catch (error) {
    return res.sendStatus(httpStatus.BAD_REQUEST);
  }
}

export async function getActivitiesByDay(req: AuthenticatedRequest, res: Response) {
  const { date } = req.params as { date: string };
  const newDate = new Date(date);

  if (isNaN(newDate.getTime())) {
    return res.sendStatus(httpStatus.BAD_REQUEST);
  }
  try {
    const activities = await activitiesService.getActivitiesByDay(newDate);
    return res.status(httpStatus.OK).send(activities);
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
    return res.sendStatus(httpStatus.BAD_REQUEST);
  }
}


export async function unsubscribeActivity(req: AuthenticatedRequest, res: Response) {
  try {
    const { userId } = req;
    const activityId = Number(req.params.activityId);
    if (!activityId) {
      return res.sendStatus(httpStatus.BAD_REQUEST);
    }
    await activitiesService.deleteActivityById(userId, Number(activityId));
    return res.sendStatus(httpStatus.ACCEPTED);
  } catch (error) {
    if (error.name === 'CannotSubscribeError') {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }
    return res.sendStatus(httpStatus.NOT_FOUND);
  }
}
