// backend/utils/statusHelper.js
export const getStatusFromCode = (statusCode, responseTimeMs, slowThreshold = 10000) => {
  let status = "DOWN";
  let reason = "UNKNOWN_ERROR";

  if (statusCode >= 200 && statusCode < 400) {
    status = "UP";
    reason = "OK";
  } else if ([401, 403, 404, 429].includes(statusCode)) {
    status = "UP";
    reason = `${statusCode} STATUS`;
  } else if (statusCode >= 400 && statusCode < 500) {
    status = "DOWN";
    reason = `CLIENT ERROR (${statusCode})`;
  } else if (statusCode >= 500) {
    status = "DOWN";
    reason = `SERVER ERROR (${statusCode})`;
  }

  // Slow response override
  if (status === "UP" && responseTimeMs && responseTimeMs > slowThreshold) {
    status = "SLOW";
    reason = "SLOW RESPONSE";
  }

  return { status, reason };
};
