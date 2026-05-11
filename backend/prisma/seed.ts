import { PrismaClient, Role, BookingStatus } from '@prisma/client'
import argon2 from 'argon2'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding...')

  // Clean DB (order matters because of FK constraints)
  await prisma.booking.deleteMany()
  await prisma.timeSlot.deleteMany()
  await prisma.doctor.deleteMany()
  await prisma.userSession.deleteMany()
  await prisma.user.deleteMany()

  const password = await argon2.hash('Password123!')

  // ============================================================
  // USERS
  // ============================================================

  const users = await prisma.user.createMany({
    data: [
      {
        firstName: 'Admin',
        lastName: 'One',
        email: 'admin@test.com',
        passwordHash: password,
        role: Role.ADMIN,
      },
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        passwordHash: password,
        role: Role.CLIENT,
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@test.com',
        passwordHash: password,
        role: Role.CLIENT,
      },
      {
        firstName: 'Dr',
        lastName: 'House',
        email: 'house@test.com',
        passwordHash: password,
        role: Role.DOCTOR,
      },
      {
        firstName: 'Dr',
        lastName: 'Strange',
        email: 'strange@test.com',
        passwordHash: password,
        role: Role.DOCTOR,
      },
    ],
  })

  // You need actual user records (not createMany return)
  const allUsers = await prisma.user.findMany()

  const doctorUsers = allUsers.filter(u => u.role === Role.DOCTOR)
  const clientUsers = allUsers.filter(u => u.role === Role.CLIENT)

  // ============================================================
  // DOCTORS
  // ============================================================

  const doctors = []

  for (const user of doctorUsers) {
    const doctor = await prisma.doctor.create({
      data: {
        userId: user.id,
        specialty: user.email.includes('house')
          ? 'Diagnostics'
          : 'Neurosurgery',
        bio: 'Experienced doctor',
      },
    })

    doctors.push(doctor)
  }

  // ============================================================
  // TIMESLOTS
  // ============================================================

  const slots = []

  for (const doctor of doctors) {
    for (let i = 0; i < 3; i++) {
      const start = new Date()
      start.setDate(start.getDate() + i)
      start.setHours(9 + i)

      const end = new Date(start)
      end.setHours(start.getHours() + 1)

      const slot = await prisma.timeSlot.create({
        data: {
          doctorId: doctor.id,
          startsAt: start,
          endsAt: end,
        },
      })

      slots.push(slot)
    }
  }

  // ============================================================
  // BOOKINGS
  // ============================================================

  for (let i = 0; i < Math.min(clientUsers.length, slots.length); i++) {
    await prisma.booking.create({
      data: {
        userId: clientUsers[i].id,
        slotId: slots[i].id,
        status: BookingStatus.CONFIRMED,
      },
    })

    // mark slot as booked
    await prisma.timeSlot.update({
      where: { id: slots[i].id },
      data: { isBooked: true },
    })
  }

  console.log('✅ Seeding finished')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })