const internalServerUrl = 'http://localhost:3000'; // todo: better way of getting internal server

export const getBackendServer = async (path: string) => {
  return await fetch(`${internalServerUrl}/${path}`);
}