const isProd =
  process.env.NODE_ENV === "production"

module.exports = {

  accessCookie: {

    httpOnly: true,

    secure: isProd,

    sameSite:
      isProd
        ? "none"
        : "lax",

    domain:
      isProd
        ? ".belisenang.id"
        : undefined,

    path: "/",

    maxAge:
      15 * 60 * 1000

  },

  refreshCookie: {

    httpOnly: true,

    secure: isProd,

    sameSite:
      isProd
        ? "none"
        : "lax",

    domain:
      isProd
        ? ".belisenang.id"
        : undefined,

    path: "/",

    maxAge:
      7 * 24 * 60 * 60 * 1000

  }

};