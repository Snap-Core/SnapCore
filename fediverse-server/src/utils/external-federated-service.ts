export const getExternalServer = async (domain : string, path: string) => {
  return await fetch(`https://${domain}/${path}`);
}

export const getExternalServerUrl = async (url : string, headers : HeadersInit | undefined = undefined ) => {
  if (headers) {
    return await fetch(url, {
      headers: headers
    });
  }
  return await fetch(`${url}`);
}