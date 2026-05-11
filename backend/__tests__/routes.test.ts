import { testBuildApp } from "@/index"
import { PrismaClient, Role } from "@prisma/client"

const prisma = new PrismaClient()

let app: any
let adminToken: string
let userToken: string
let adminId: string
let userId: string
let doctorId: string
let slotId: string
let slotId2: string
let bookingId: string

// =========================
// GLOBAL SETUP
// =========================
beforeAll(async () => {
  app = await testBuildApp()

  await prisma.booking.deleteMany()
  await prisma.timeSlot.deleteMany()
  await prisma.doctor.deleteMany()
  await prisma.user.deleteMany()

  // ADMIN
  const admin = await prisma.user.create({
    data: {
      firstName: "Admin",
      lastName: "User",
      email: "admin@test.com",
      passwordHash: "hashed",
      role: Role.ADMIN,
    },
  })

  // USER
  const user = await prisma.user.create({
    data: {
      firstName: "Normal",
      lastName: "User",
      email: "user@test.com",
      passwordHash: "hashed",
      role: Role.CLIENT,
    },
  })

  adminId = admin.id
  userId = user.id

  adminToken = app.accessSign({
    sub: admin.id,
    role: admin.role,
    email: admin.email,
  })

  userToken = app.accessSign({
    sub: user.id,
    role: user.role,
    email: user.email,
  })

  // DOCTOR (needs userId!)
  const doctorUser = await prisma.user.create({
    data: {
      firstName: "Doc",
      lastName: "Tor",
      email: "doctor@test.com",
      passwordHash: "hashed",
      role: Role.DOCTOR,
    },
  })

  const doctor = await prisma.doctor.create({
    data: {
      userId: doctorUser.id,
      specialty: "Cardiology",
    },
  })

  doctorId = doctor.id

  // TIMESLOT
  const slot = await prisma.timeSlot.create({
    data: {
      doctorId,
      startsAt: new Date(Date.now() + 3600000),
      endsAt: new Date(Date.now() + 7200000),
    },
  })

  slotId = slot.id

  const slot2= await prisma.timeSlot.create({
    data: {
      doctorId,
      startsAt: new Date(Date.now() + 3600000),
      endsAt: new Date(Date.now() + 7200000),
    },
  })

  slotId2 = slot2.id
})

// =========================
// CLEANUP
// =========================
afterAll(async () => {
  await prisma.$disconnect()
  await app.close()
})

// =========================
// USER ROUTES
// =========================
describe("User Routes", () => {
  it("admin should list users", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/users",
      headers: { authorization: `Bearer ${adminToken}` },
    })

    expect(res.statusCode).toBe(200)
  })

  it("user should get own profile", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/users/me",
      headers: { authorization: `Bearer ${userToken}` },
    })

    expect(res.statusCode).toBe(200)
  })

  it("user should update profile", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/users/me",
      headers: { authorization: `Bearer ${userToken}` },
      payload: { firstName: "Updated" },
    })

    expect(res.statusCode).toBe(200)
  })

  it("admin should get user by id", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/users/${userId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    })

    expect(res.statusCode).toBe(200)
  })
})

// =========================
// DOCTOR ROUTES
// =========================
describe("Doctor Routes", () => {
  it("admin should list doctors", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/doctors",
      headers: { authorization: `Bearer ${adminToken}` },
    })

    expect(res.statusCode).toBe(200)
  })

  it("admin should get doctor by id", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/doctors/${doctorId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    })

    expect(res.statusCode).toBe(200)
  })

  it("doctor should get own profile", async () => {
    const doctorToken = app.accessSign({
      sub: (await prisma.user.findFirst({ where: { role: Role.DOCTOR } }))!.id,
      role: Role.DOCTOR,
    })

    console.log(app.printRoutes())

    const res = await app.inject({
      method: "GET",
      url: "/api/doctors/me",
      headers: { authorization: `Bearer ${doctorToken}` },
    })

    expect(res.statusCode).toBe(200)
  })
})

// =========================
// TIMESLOT ROUTES
// =========================
describe("TimeSlot Routes", () => {
  it("should get doctor slots", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/slots/doctor/${doctorId}`,
      headers: { authorization: `Bearer ${userToken}` },
    })

    expect(res.statusCode).toBe(200)
  })

  it("admin should create slot", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/slots",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        doctorId,
        startsAt: new Date(Date.now() + 8000000).toISOString(),
        endsAt: new Date(Date.now() + 9000000).toISOString(),
      },
    })

    expect(res.statusCode).toBe(200)
  })

  it("admin should delete slot", async () => {
    const newSlot = await prisma.timeSlot.create({
      data: {
        doctorId,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 3600000),
      },
    })

    const res = await app.inject({
      method: "DELETE",
      url: `/api/slots/${newSlot.id}`,
      headers: { authorization: `Bearer ${adminToken}` },
    })

    expect(res.statusCode).toBe(200)
  })
})

// =========================
// BOOKING ROUTES
// =========================
describe("Booking Routes", () => {
  it("user should create booking", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/bookings",
      headers: { authorization: `Bearer ${userToken}` },
      payload: { slotId },
    })

    expect(res.statusCode).toBe(200)
    bookingId = res.json().data.id
  })

  it("should get user bookings", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/bookings/me",
      headers: { authorization: `Bearer ${userToken}` },
    })

    expect(res.statusCode).toBe(200)
  })

  it("should prevent double booking", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/bookings",
      headers: { authorization: `Bearer ${userToken}` },
      payload: { slotId },
    })

    expect(res.statusCode).toBe(400)
  })

  it("user should cancel booking", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/bookings/${bookingId}/cancel`,
      headers: { authorization: `Bearer ${userToken}` },
    })

    expect(res.statusCode).toBe(200)
  })

  it("admin should confirm booking", async () => {
    // recreate booking
    const booking = await prisma.booking.create({
      data: {
        userId,
        slotId: slotId2,
      },
    })

    const res = await app.inject({
      method: "POST",
      url: `/api/bookings/${booking.id}/confirm`,
      headers: { authorization: `Bearer ${adminToken}` },
    })

    expect(res.statusCode).toBe(200)
  })
})

// =========================
// SESSION ROUTES
// =========================
describe("Session Routes", () => {
  it("should fail logout without refresh token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/sessions/logout",
      headers: {
        authorization: `Bearer ${userToken}`,
      },
    })

    expect(res.statusCode).toBe(400)
  })

  it("should logout with refresh token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/sessions/logout",
      headers: {
        authorization: `Bearer ${userToken}`,
        "x-refresh-token": "fake-refresh-token",
      },
    })

    // depends on your revokeSession logic
    expect([200, 400]).toContain(res.statusCode)
  })
})