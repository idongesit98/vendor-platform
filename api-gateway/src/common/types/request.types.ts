export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
  };
  traceId: string;
}
