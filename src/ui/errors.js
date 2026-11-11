export const isTodo = (error) => error.message.startsWith('TODO');

export const explain = (error) => (isTodo(error) ? 'not implemented yet' : `error: ${error.message}`);
