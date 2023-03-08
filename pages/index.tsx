import { GetServerSideProps } from "next";
import { Page } from "../components/pages/index/page";
import { getAuth, isAuthenticated } from "../modules/session";

export const getServerSideProps: GetServerSideProps =
  async function getServerSideProps(ctx) {
    if (process.env.MOCK_SESSION === "enabled") {
      return { props: {} };
    }
    const auth = getAuth();
    if (isAuthenticated(auth) === false)
      return {
        redirect: { destination: "/authenticate", permanent: false },
      };
    return { props: {} };
  };

export default Page;
