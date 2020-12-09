import { getServerSideProps } from "../../pages/oauth2/authorize";

it("authorize", async () => {
  const res = await getServerSideProps({ query: { client_id: "foo" } } as any);
  console.log(res);
  expect(res).toBeTruthy();
});
export {};
