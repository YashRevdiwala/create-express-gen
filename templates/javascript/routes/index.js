const express = require("express")
const { sayHello } = require("../lib/common")
const { sampleController } = require("../controllers/sampleController")

const router = express.Router()

router.get("/", (req, res) => {
  res.send(sayHello("World"))
})

router.get("/sample", sampleController)

module.exports = router
