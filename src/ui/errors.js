export const isTodo = (error) => error.message.startsWith('TODO');

export const explain = (error) =>
  isTodo(error) ? `coming soon (${error.message.slice(5)})` : `error: ${error.message}`;
