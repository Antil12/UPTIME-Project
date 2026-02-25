import sendSlowBatchEmail from "./sendSlowBatchEmail.js";

let latestSlowBatch = null;

export const setSlowBatch = (data) => {
  latestSlowBatch = data;

  if (data) {
    // fire-and-forget using the template renderer
    sendSlowBatchEmail(data).catch((err) =>
      console.error("❌ Failed to send slow-batch email:", err)
    );
  }
};

export const getSlowBatch = () => {
  return latestSlowBatch;
};

export const clearSlowBatch = () => {
  latestSlowBatch = null;
};
