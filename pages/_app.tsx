import "../styles.css";
import type { AppProps } from "next/app";
import Layout from "../components/layout";

if (process.env.NEXT_PUBLIC_API_MOCKING === "enabled") {
  require("../modules/mocks/setup");
}

const App: React.FC<AppProps> = ({ Component, pageProps }) => {
  return <Layout><Component {...pageProps} /></Layout>;
};

export default App;
