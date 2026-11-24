interface SuccessResponse<Data> {
  success: true;
  message?: string;
  data?: Data;
}

interface FieldValidationError {
  type: "field";
  path: string;
  msg: string;
}

interface ErrorResponse {
  success: false;
  message?: string;
  errors?: FieldValidationError[];
}

type ApiResponse<Data> = SuccessResponse<Data> | ErrorResponse;

export type { ApiResponse, ErrorResponse, FieldValidationError };
