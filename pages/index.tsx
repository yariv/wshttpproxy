import { GetServerSideProps, InferGetServerSidePropsType } from "next";

function HomePage({
  data,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  console.log(data);
  return <div>Welcome {data}</div>;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  console.log(context);
  return { props: { data: "hi" } };
};

export default HomePage;
