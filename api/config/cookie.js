module.exports = {
  accessCookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 3 * 60 * 1000,
    path: "/",
  },
  refreshCookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  },
};

// const isProd =
//   process.env.NODE_ENV === "production"

// module.exports = {

//   accessCookie: {

//     httpOnly: true,

//     secure: isProd,

//     sameSite:
//       isProd
//         ? "none"
//         : "lax",

//     domain:
//       isProd
//         ? ".belisenang.id"
//         : undefined,

//     path: "/",

//     maxAge:
//       15 * 60 * 1000

//   },

//   refreshCookie: {

//     httpOnly: true,

//     secure: isProd,

//     sameSite:
//       isProd
//         ? "none"
//         : "lax",

//     domain:
//       isProd
//         ? ".belisenang.id"
//         : undefined,

//     path: "/",

//     maxAge:
//       7 * 24 * 60 * 60 * 1000

//   }

// };