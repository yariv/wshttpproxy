interface HttpResponse<T> extends Response {
  parsedBody?: T;
}

// TODO replace
export async function http<T>(request: RequestInfo): Promise<HttpResponse<T>> {
  const response: HttpResponse<T> = await fetch(request);

  try {
    // may error if there is no body
    response.parsedBody = await response.json();
  } catch (ex) {}

  if (!response.ok) {
    throw new Error(response.statusText);
  }
  return response;
}

export async function post<T>(
  path: string,
  body: any,
  args: RequestInit = {
    method: "post",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  }
): Promise<HttpResponse<T>> {
  const req = new Request(path, args);
  return await http<T>(req);
}
