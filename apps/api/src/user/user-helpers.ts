const getAuthenticatedUserId = (req: { user?: Express.User }): number => {
  if (!req.user) {
    throw new Error(
      "No authenticated user on request. Is requireAuth applied to this route?",
    );
  }

  return req.user.id;
};

export { getAuthenticatedUserId };
