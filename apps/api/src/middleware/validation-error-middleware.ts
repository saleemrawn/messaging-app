import type { Request, Response, NextFunction } from "express";
import type { ApiResponse } from "../types/api-types.ts";
import { validationResult, type ValidationError } from "express-validator";

const handleValidationErrors = (
  req: Request<object, object, object, object>,
  res: Response<ApiResponse<object, ValidationError[]>>,
  next: NextFunction,
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }
  next();
};

export { handleValidationErrors };
