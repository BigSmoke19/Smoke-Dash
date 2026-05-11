"use client"

import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { ROUTES } from "@/lib/constants"

import styles from "./page.module.css"

export default function HomePage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleDasboardRoute = () => {
    const role = user ? user.role : "none"

    if (["ADMIN"].includes(role)) {
      router.push(ROUTES.adminDashboard)
    } else if (role === "DOCTOR") {
      router.push(ROUTES.doctorDashboard)
    } else {
      router.push(ROUTES.dashboard)
    }
  }

  return (
    <div className={styles.page}>

      {/* HEADER */}
      <header className={styles.header}>

        <div className={styles.brand}>
          <h1>Smoke Dash</h1>
          <p>Operations & workflow management</p>
        </div>

        <div className={styles.authSection}>

          {user ? (
            <>
              <div className={styles.userText}>
                Signed in as{" "}
                <span>{user.firstName}</span>
              </div>

              <button
                onClick={() => {
                  logout()
                  router.push("/login")
                }}
                className="btn btn-danger"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="btn btn-primary"
            >
              Sign In
            </button>
          )}

        </div>

      </header>

      {/* HERO */}
      <main className={styles.main}>

        <section className={`${styles.heroCard} card`}>

          <div className={styles.glowTop} />
          <div className={styles.glowBottom} />

          <div className={styles.heroContent}>

            <div className={styles.badge}>
              MODERN ADMIN PLATFORM
            </div>

            <h2 className={styles.title}>
              Manage Operations
              <span>Without Chaos</span>
            </h2>

            <p className={styles.description}>
              Centralize workflows, monitor activity, manage teams,
              and control operations through a scalable dashboard.
            </p>

            <div className={styles.actions}>

              <button
                onClick={handleDasboardRoute}
                className={`${styles.primaryButton} btn`}
              >
                Go to Dashboard
              </button>

              {!user && (
                <button
                  onClick={() => router.push("/login")}
                  className={`${styles.secondaryButton} btn`}
                >
                  Access Platform
                </button>
              )}

            </div>

          </div>

        </section>

      </main>

      {/* FOOTER */}
      <footer className={styles.footer}>
        © {new Date().getFullYear()} Smoke Dash. All rights reserved.
      </footer>

    </div>
  )
}