import { prisma, redis } from "../../config";

async function findFirst() {
  return await prisma.event.findFirst();
  /*
  const eventCache = await redis.get("event");
  if (!eventCache || JSON.parse(eventCache).id === undefined) {
    const event = await prisma.event.findFirst();
    await redis.set("event", JSON.stringify(event));
    return event;
  }
  return JSON.parse(eventCache);
  */
}

const eventRepository = {
  findFirst,
};

export default eventRepository;
