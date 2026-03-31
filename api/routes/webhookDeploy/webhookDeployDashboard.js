const express = require("express");
const { exec } = require("child_process");

const router = express.Router();

router.post("/deploy", (req, res) => {

    console.log("github webhook api received")

    exec("sh /www/wwwroot/api.belisenang.id/deploy.sh",
        (err, stdout, stderr) => {

            console.log(stdout)

            if (err) {
                console.error(stderr)
            }

        }
    )

    res.json({
        success: true
    })

});

router.post("/dashboard", (req, res) => {

    console.log("webhook dashboard triggered");

    exec("/www/wwwroot/deploy-dashboard.sh", (err, stdout, stderr) => {

        if (err) {
            console.error(stderr);
            return res.status(500).json({
                success: false,
                error: stderr
            });
        }

        console.log(stdout);

        res.json({
            success: true,
            message: "dashboard deployed"
        });

    });

});

module.exports = router;