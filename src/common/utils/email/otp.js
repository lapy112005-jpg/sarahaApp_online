export const create_OTP = async() => {
  return Math.floor(Math.random() * (999999 - 100000 + 1) + 10000);
};
