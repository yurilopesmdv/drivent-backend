import { prisma, redis } from "../../config";

async function findHotels() {
  /*const hotelsCache = await redis.get("hotels");
  if (!hotelsCache || JSON.parse(hotelsCache).length === 0) {
    const hotels = await prisma.hotel.findMany({
      include: {
        Rooms: {
          include: {
            Booking: true,
          }
        }
      }
    });
    await redis.set("hotels", JSON.stringify(hotels));
    return hotels;
  }
  return JSON.parse(hotelsCache);
  */
  return await prisma.hotel.findMany({
    include: {
      Rooms: {
        include: {
          Booking: true,
        }
      }
    }
  });
}

async function findRoomsByHotelId(hotelId: number) {
  return prisma.hotel.findFirst({
    where: {
      id: hotelId,
    },
    include: {
      Rooms: {
        include: {
          Booking: true,
        }
      }
    }
  });
}

const hotelRepository = {
  findHotels,
  findRoomsByHotelId,
};

export default hotelRepository;
