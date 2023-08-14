import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function main() {
  await prisma.event.deleteMany({});
  await prisma.hotel.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.activitySubscription.deleteMany({})
  await prisma.activities.deleteMany({})
  await prisma.ticket.deleteMany({});
  await prisma.ticketType.deleteMany({});
  await prisma.enrollment.deleteMany({});
  //await prisma.user.deleteMany({});
  let event = await prisma.event.findFirst();
  let hotel = await prisma.hotel.findFirst();
  let room = await prisma.room.findFirst();
  let user = await prisma.user.findFirst();
  let enrollment = await prisma.enrollment.findFirst();
  let address = await prisma.address.findFirst();
  let ticketType = await prisma.ticketType.findFirst();
  let ticket = await prisma.ticket.findFirst();
  let payment = await prisma.payment.findFirst();
  //let booking = await prisma.booking.findFirst();

  if (!event) {
    event = await prisma.event.create({
      data: {
        title: 'Driven.t',
        logoImageUrl: 'https://files.driveneducation.com.br/images/logo-rounded.png',
        backgroundImageUrl: 'linear-gradient(to right, #FA4098, #FFD77F)',
        startsAt: dayjs().toDate(),
        endsAt: dayjs().add(21, 'days').toDate(),
      },
    });
  }

  if (!hotel) {
    hotel = await prisma.hotel.create({
      data: {
        name: 'Driven.t hotel',
        image: 'https://files.driveneducation.com.br/images/logo-rounded.png',
        updatedAt: dayjs().toDate(),
      },
    });
  }

  if (room) {
    room = await prisma.room.create({
      data: {
        name: 'Driven.t room',
        capacity: 3,
        hotelId: hotel.id,
        updatedAt: dayjs().toDate(),
      },
    });
  }

  if (!user) {
    const hashedPassword = await bcrypt.hash('123456', 12);
    user = await prisma.user.create({
      data: {
        email: 'email@email.com',
        password: hashedPassword,
        updatedAt: dayjs().toDate(),
      },
    });
  }

  if (!enrollment) {
    enrollment = await prisma.enrollment.create({
      data: {
        name: 'joao',
        cpf: '06459861198',
        birthday: dayjs().toDate(),
        phone: '61 9 81617008',
        userId: user.id,
      },
    });
  }

  if (!address) {
    address = await prisma.address.create({
      data: {
        cep: '71725053',
        street: 'Avenida Brigadeiro Faria Lima',
        city: 'SÃ£o Paulo',
        state: 'Itaim Bibi',
        number: '10',
        neighborhood: 'Itaim Bibi',
        addressDetail: 'de 3252 ao fim - lado par',
        enrollmentId: enrollment.id,
      },
    });
  }

  if (!ticketType) {
    ticketType = await prisma.ticketType.create({
      data: {
        name: "Online",
        price: 100,
        isRemote: true,
        includesHotel: false
      },
    });
    await prisma.ticketType.create({
      data: {
        name: 'Presencial',
        price: 250,
        isRemote: false,
        includesHotel: false
      },
    })
    await prisma.ticketType.create({
      data: {
        name: 'Presencial',
        price: 600,
        isRemote: false,
        includesHotel: true
      },
    })

  }

  if (!ticket) {
    ticket = await prisma.ticket.create({
      data: {
        ticketTypeId: ticketType.id,
        enrollmentId: enrollment.id,
        status: 'PAID',
      },
    });
  }

  if (!payment) {
    payment = await prisma.payment.create({
      data: {
        ticketId: ticket.id,
        value: 13,
        cardIssuer: 'Visa',
        cardLastDigits: '2323',
      },
    });
  }

  /*
  if (!booking) {
    booking = await prisma.booking.create({
      data: {
        userId: user.id,
        roomId: room.id,
        updatedAt: dayjs().toDate()
      },
    });
  }
  */

  console.log({ event, hotel, room, user, enrollment, address, ticketType, ticket, payment });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });