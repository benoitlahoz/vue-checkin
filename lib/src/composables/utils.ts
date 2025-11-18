export const NoOp = (..._args: any[]) => {};

export const Debug = (message: string, ...args: any[]) => {
  console.log(message, ...args);
};
