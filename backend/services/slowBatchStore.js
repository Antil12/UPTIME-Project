let latestSlowBatch = null;

export const setSlowBatch = (data) => {
  latestSlowBatch = data;
};

export const getSlowBatch = () => {
  return latestSlowBatch;
};

export const clearSlowBatch = () => {
  latestSlowBatch = null;
};
