export const getExternalServer = async (domain : string, path: string) => {
  return await fetch(`https://${domain}/${path}`);
}

export const getExternalServerUrl = async (url : string) => {
  return await fetch(`${url}`);
}