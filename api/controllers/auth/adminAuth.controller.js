const service = require("../../services/auth/adminAuth.service");
const cookieConfig = require("../../config/cookie");

module.exports = {
  async login(req, res) {
    const result = await service.login(req.body.email, req.body.password, req);

    res
      .cookie("access_token", result.accessToken, cookieConfig.accessCookie)
      .cookie("refresh_token", result.refreshToken, cookieConfig.refreshCookie)
      .json({
        status: true,
        user: result.user,
      });
  },

  async refresh(req, res) {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({
        status: false,
        code: "NO_REFRESH",
      });
    }

    try {
      const result = await service.refresh(refreshToken);

      res
        .cookie("access_token", result.accessToken, cookieConfig.accessCookie)
        .cookie("refresh_token", result.refreshToken, cookieConfig.refreshCookie)
        .json({ status: true });

    } catch (err) {
      return res.status(401).json({
        status: false,
        code: "REFRESH_FAILED",
      });
    }
  },

  async logout(req, res) {
    try {
      const token = req.cookies.refresh_token;
      if (token) await service.logout(token);

      res
        .clearCookie("access_token", cookieConfig.accessCookie)
        .clearCookie("refresh_token", cookieConfig.refreshCookie)
        .json({
          status: true,
          message: "Logged out",
        });
    } catch {
      res.status(200).json({ status: true });
    }
  },
};
