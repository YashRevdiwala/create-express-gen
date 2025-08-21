import { Request, Response } from "express"

export function sampleController(req: Request, res: Response) {
  res.json({ message: "This is a sample controller!" })
}
