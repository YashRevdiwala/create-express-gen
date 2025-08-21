import { Router, Request, Response } from "express"
import { sayHello } from "../lib/common"
import { sampleController } from "../controllers/sampleController"

const router = Router()

router.get("/", (req: Request, res: Response) => {
  res.send(sayHello("World"))
})

router.get("/sample", sampleController)

export default router
