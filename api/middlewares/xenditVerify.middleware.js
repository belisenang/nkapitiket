module.exports = (req, res, next) => {

    const token =
        req.headers["x-callback-token"]

    if (!token) {

        return res.status(401).json({
            success: false,
            message: "no callback token"
        })

    }

    if (
        token !==
        process.env.XENDIT_CALLBACK_TOKEN
    ) {

        return res.status(403).json({
            success: false,
            message: "invalid callback token"
        })

    }

    next()

}